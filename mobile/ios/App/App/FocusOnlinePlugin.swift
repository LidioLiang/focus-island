import Foundation
import Security
@preconcurrency import Capacitor
import StoreKit
import WebKit

private struct IslandSession: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Double
    let userId: String
}

private enum IslandNetworkError: Error { case invalidRequest, invalidResponse, keychain(OSStatus) }

private final class NoRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil) // Never forward a credential to a redirect destination.
    }
}

private actor IslandAPI {
    static let shared = IslandAPI()
    private let origin = "https://focusisle.online"
    private let key: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "online.focusisle.app.auth", kSecAttrAccount as String: "session"]
    private var tail: Task<Void, Never>?
    private let transport = URLSession(configuration: .ephemeral, delegate: NoRedirects(), delegateQueue: nil)

    // Serialize refresh, sign-in, sign-out and requests to prevent a late refresh from restoring an old account.
    func request(path: String, method: String, body: String?, owner: String?, binary: Data? = nil, contentType: String? = nil) async throws -> [String: Any] {
        let previous = tail
        let task = Task { () throws -> [String: Any] in
            await previous?.value
            return try await self.perform(path: path, method: method, body: body, owner: owner, binary: binary, contentType: contentType)
        }
        tail = Task { _ = try? await task.value }
        return try await task.value
    }

    private func readSession() throws -> IslandSession? {
        var query = key
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = item as? Data else { throw IslandNetworkError.keychain(status) }
        return try JSONDecoder().decode(IslandSession.self, from: data)
    }

    private func saveSession(_ session: IslandSession?) throws {
        guard let session else {
            let status = SecItemDelete(key as CFDictionary)
            guard status == errSecSuccess || status == errSecItemNotFound else { throw IslandNetworkError.keychain(status) }
            return
        }
        let values: [String: Any] = [kSecValueData as String: try JSONEncoder().encode(session),
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
        let status = SecItemUpdate(key as CFDictionary, values as CFDictionary)
        if status == errSecItemNotFound {
            let add = SecItemAdd(key.merging(values) { _, new in new } as CFDictionary, nil)
            guard add == errSecSuccess else { throw IslandNetworkError.keychain(add) }
        } else if status != errSecSuccess { throw IslandNetworkError.keychain(status) }
    }

    private func send(path: String, method: String, body: String?, session: IslandSession?, owner: String?, binary: Data? = nil, contentType: String? = nil) async throws -> (Int, [String: Any]) {
        guard path.hasPrefix("/api/"), !path.contains(".."), !path.contains("%"), !path.contains("\\"),
              let url = URL(string: origin + path), url.host == "focusisle.online", url.scheme == "https" else {
            throw IslandNetworkError.invalidRequest
        }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.httpMethod = method
        request.httpShouldHandleCookies = false
        request.setValue(contentType ?? "application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let session { request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization") }
        if let owner { request.setValue(owner, forHTTPHeaderField: "X-Focus-User") }
        request.httpBody = binary ?? body?.data(using: .utf8)
        let (data, response) = try await transport.data(for: request)
        guard let response = response as? HTTPURLResponse, data.count < 8_000_000,
              let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw IslandNetworkError.invalidResponse }
        return (response.statusCode, json)
    }

    private func jsonString(_ value: [String: Any]) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value), as: UTF8.self)
    }

    private func perform(path: String, method: String, body: String?, owner: String?, binary: Data?, contentType: String?) async throws -> [String: Any] {
        let route = path.components(separatedBy: "?")[0]
        let allowed = ["/api/auth/session", "/api/auth/merge/prepare", "/api/auth/merge/complete", "/api/account"]
        let prefixes = ["/api/rooms/", "/api/sessions/", "/api/focus/", "/api/profile", "/api/access/", "/api/scenes", "/api/mobile/"]
        guard allowed.contains(route) || prefixes.contains(where: { route.hasPrefix($0) }),
              ["GET", "POST", "PUT", "PATCH", "DELETE"].contains(method), (body?.utf8.count ?? 0) <= 1_000_000,
              route != "/api/mobile/auth/refresh" else { throw IslandNetworkError.invalidRequest }
        if binary != nil || contentType != nil {
            guard route == "/api/profile/avatar", method == "POST", body == nil,
                  let binary, binary.count <= 4_300_000, let contentType,
                  contentType.range(of: #"^multipart/form-data; boundary=[A-Za-z0-9_-]{1,100}$"#, options: .regularExpression) != nil else { throw IslandNetworkError.invalidRequest }
        }
        var session = try readSession()
        if let owner, owner != session?.userId { return ["status": 409, "body": ["error": "identity_changed"]] }
        if let old = session, old.expiresAt <= Date().timeIntervalSince1970 + 60 {
            let (status, payload) = try await send(path: "/api/mobile/auth/refresh", method: "POST",
                body: jsonString(["refreshToken": old.refreshToken]), session: nil, owner: nil)
            guard status == 200, let value = payload["session"] else {
                if status == 401 { try saveSession(nil) }
                return ["status": status, "body": ["error": "authentication_required"]]
            }
            let refreshed = try JSONDecoder().decode(IslandSession.self, from: JSONSerialization.data(withJSONObject: value))
            guard refreshed.userId == old.userId else { throw IslandNetworkError.invalidResponse }
            try saveSession(refreshed)
            session = refreshed
        }
        var requestBody = body
        if route == "/api/mobile/auth/sign-out" {
            guard let session else { return ["status": 200, "body": ["ok": true]] }
            requestBody = try jsonString(["accessToken": session.accessToken, "refreshToken": session.refreshToken])
        }
        let (status, received) = try await send(path: path, method: method, body: requestBody, session: session, owner: owner, binary: binary, contentType: contentType)
        var payload = received
        if let value = payload.removeValue(forKey: "session"), status == 200, route.hasPrefix("/api/mobile/auth/") {
            let newSession = try JSONDecoder().decode(IslandSession.self, from: JSONSerialization.data(withJSONObject: value))
            try saveSession(newSession)
        }
        if status == 200 && (route == "/api/mobile/auth/sign-out" || (route == "/api/account" && method == "DELETE")) { try saveSession(nil) }
        return ["status": status, "body": payload]
    }
}

@objc(FocusOnlinePlugin)
public class FocusOnlinePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FocusOnlinePlugin"
    public let jsName = "FocusOnline"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "securityCheck", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]
    private let productIds = ["online.focusisle.plus.monthly", "online.focusisle.plus.annual"]
    private var transactionUpdates: Task<Void, Never>?
    private var purchaseInProgress = false
    private var securityInProgress = false

    public override func load() {
        transactionUpdates = Task { [weak self] in
            for await verification in Transaction.updates {
                guard let self else { return }
                do { try await self.deliver(verification) }
                catch { self.notifyListeners("purchaseSyncPending", data: ["pending": true]) }
            }
        }
    }

    deinit { transactionUpdates?.cancel() }

    @objc func securityCheck(_ call: CAPPluginCall) {
        Task {
            do {
                let response = try await IslandAPI.shared.request(path: "/api/mobile/auth/config", method: "GET", body: nil, owner: nil)
                guard response["status"] as? Int == 200, let config = response["body"] as? [String: Any], config["enabled"] as? Bool == true else { call.reject("mobile_auth_unavailable"); return }
                if config["captchaRequired"] as? Bool != true { call.resolve(["token": ""]); return }
                await MainActor.run {
                    guard !self.securityInProgress, let presenter = self.bridge?.viewController, presenter.presentedViewController == nil else { call.reject("security_check_busy"); return }
                    self.securityInProgress = true
                    let check = IslandSecurityCheck { [weak self] token in
                        self?.securityInProgress = false
                        if let token { call.resolve(["token": token]) } else { call.reject("captcha_required") }
                    }
                    let navigation = UINavigationController(rootViewController: check)
                    navigation.modalPresentationStyle = .fullScreen
                    presenter.present(navigation, animated: true)
                }
            } catch { call.reject("security_check_unavailable") }
        }
    }

    @objc func products(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: productIds)
                call.resolve(["products": products.filter { $0.type == .autoRenewable }.map {
                    ["id": $0.id, "name": $0.displayName, "price": $0.displayPrice]
                }])
            } catch { call.reject("products_unavailable") }
        }
    }

    private func currentOwner() async throws -> String {
        let response = try await IslandAPI.shared.request(path: "/api/auth/session", method: "GET", body: nil, owner: nil)
        guard response["status"] as? Int == 200, let body = response["body"] as? [String: Any],
              body["authenticated"] as? Bool == true, body["anonymous"] as? Bool == false,
              let owner = body["userId"] as? String, UUID(uuidString: owner) != nil else { throw IslandNetworkError.invalidRequest }
        return owner
    }

    private func deliver(_ verification: VerificationResult<Transaction>) async throws {
        guard case .verified(let transaction) = verification,
              productIds.contains(transaction.productID), let owner = transaction.appAccountToken else { throw IslandNetworkError.invalidResponse }
        let body = String(decoding: try JSONSerialization.data(withJSONObject: ["signedTransaction": verification.jwsRepresentation]), as: UTF8.self)
        let result = try await IslandAPI.shared.request(path: "/api/mobile/billing/verify", method: "POST", body: body, owner: owner.uuidString.lowercased())
        guard result["status"] as? Int == 200 else { throw IslandNetworkError.invalidResponse }
        // Leave unacknowledged transactions unfinished so relaunch/restore can retry safely.
        await transaction.finish()
        notifyListeners("subscriptionChanged", data: result["body"] as? [String: Any] ?? [:])
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard !purchaseInProgress, let productId = call.getString("productId"), productIds.contains(productId) else { call.reject("invalid_purchase"); return }
        purchaseInProgress = true
        Task {
            defer { purchaseInProgress = false }
            do {
                let readiness = try await IslandAPI.shared.request(path: "/api/mobile/billing/config", method: "GET", body: nil, owner: nil)
                guard readiness["status"] as? Int == 200, let configuration = readiness["body"] as? [String: Any],
                      configuration["enabled"] as? Bool == true else { call.reject("apple_billing_unavailable"); return }
                let owner = try await currentOwner()
                let access = try await IslandAPI.shared.request(path: "/api/access/status", method: "GET", body: nil, owner: owner)
                guard access["status"] as? Int == 200, let status = access["body"] as? [String: Any],
                      let entitlement = status["entitlementType"] as? String else { call.reject("access_service_unavailable"); return }
                guard entitlement == "none" else { call.reject("already_subscribed"); return }
                // Retry delivery of an already paid transaction before presenting another purchase sheet.
                for await pending in Transaction.unfinished {
                    guard case .verified(let transaction) = pending, productIds.contains(transaction.productID),
                          transaction.appAccountToken?.uuidString.lowercased() == owner else { continue }
                    do { try await deliver(pending); call.resolve(["status": "verified"]) }
                    catch { call.resolve(["status": "sync_pending"]) }
                    return
                }
                guard let product = try await Product.products(for: [productId]).first, product.type == .autoRenewable,
                      let token = UUID(uuidString: owner) else { call.reject("products_unavailable"); return }
                switch try await product.purchase(options: [.appAccountToken(token)]) {
                case .success(let verification):
                    do { try await deliver(verification); call.resolve(["status": "verified"]) }
                    catch { call.resolve(["status": "sync_pending"]) }
                case .pending: call.resolve(["status": "pending"])
                case .userCancelled: call.resolve(["status": "cancelled"])
                @unknown default: call.reject("purchase_unavailable")
                }
            } catch { call.reject("purchase_not_completed") }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                _ = try await currentOwner()
                try await AppStore.sync()
                var restored = 0
                for await verification in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = verification, productIds.contains(transaction.productID) else { continue }
                    try await deliver(verification)
                    restored += 1
                }
                call.resolve(["restored": restored])
            } catch { call.reject("restore_not_completed") }
        }
    }
    @objc func request(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else { call.reject("invalid_request"); return }
        Task {
            do {
                let result = try await IslandAPI.shared.request(path: path, method: call.getString("method") ?? "GET",
                    body: call.getString("body"), owner: call.getString("owner"),
                    binary: call.getString("bodyBase64").flatMap { Data(base64Encoded: $0) }, contentType: call.getString("contentType"))
                call.resolve(result)
            } catch { call.reject("network_unavailable") }
        }
    }
}

class FocusBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FocusOnlinePlugin())
        bridge?.registerPluginInstance(FocusSessionPlugin())
    }
}

/// A separate ephemeral web view receives only the anti-abuse challenge, never account credentials.
private final class IslandSecurityCheck: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var webView: WKWebView!
    private var completed = false
    private let done: (String?) -> Void
    init(done: @escaping (String?) -> Void) { self.done = done; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override func viewDidLoad() {
        super.viewDidLoad(); title = "Security check"
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(cancel))
        let config = WKWebViewConfiguration(); config.websiteDataStore = .nonPersistent()
        config.userContentController.add(self, name: "focusSecurity")
        webView = WKWebView(frame: .zero, configuration: config); webView.navigationDelegate = self
        view = webView
        webView.load(URLRequest(url: URL(string: "https://focusisle.online/mobile/security")!))
    }
    @objc private func cancel() { finish(nil) }
    private func finish(_ token: String?) {
        guard !completed else { return }; completed = true
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "focusSecurity")
        dismiss(animated: true) { self.done(token) }
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.absoluteString == "https://focusisle.online/mobile/security",
              message.webView === webView, let body = message.body as? [String: Any], let token = body["token"] as? String,
              !token.isEmpty, token.utf8.count <= 4096 else { return }
        finish(token)
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if navigationAction.targetFrame?.isMainFrame == true {
            decisionHandler(url.absoluteString == "https://focusisle.online/mobile/security" ? .allow : .cancel)
        } else {
            decisionHandler(url.scheme == "https" && url.host == "challenges.cloudflare.com" || url.absoluteString == "about:blank" ? .allow : .cancel)
        }
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish(nil) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish(nil) }
}
