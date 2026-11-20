import Foundation
import AVFoundation
import UserNotifications
import Capacitor

/// The native player owns playback while WKWebView is suspended. The clock uses an absolute deadline.
@objc(FocusSessionPlugin)
public class FocusSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FocusSessionPlugin"
    public let jsName = "FocusSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "sync", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "notifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openLink", returnType: CAPPluginReturnPromise)
    ]
    private var players: [String: AVAudioPlayer] = [:]
    private var paths: [String: String] = [:]
    private var deadline: TimeInterval?
    private var running = false
    private var interrupted = false
    private var routePaused = false
    private var completion: Timer?
    private var lastNotification: TimeInterval?
    private let notificationId = "focus-isle-session-complete"
    private var observers: [NSObjectProtocol] = []
    private var journalURL: URL {
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return directory.appendingPathComponent("focus-session.json")
    }

    public override func load() {
        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] notice in
            guard let self, let raw = notice.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            if type == .began { self.interrupted = true; self.players.values.forEach { $0.pause() } }
            else {
                let options = AVAudioSession.InterruptionOptions(rawValue: notice.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0)
                self.interrupted = false
                if options.contains(.shouldResume) { self.resumeAudio() }
                else { self.routePaused = true; self.notifyListeners("audioPaused", data: ["reason": "interruption"]) }
            }
        })
        observers.append(center.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] notice in
            guard let self, let raw = notice.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  AVAudioSession.RouteChangeReason(rawValue: raw) == .oldDeviceUnavailable else { return }
            self.routePaused = true
            self.players.values.forEach { $0.pause() }
            self.notifyListeners("audioPaused", data: ["reason": "headphones_disconnected"])
        })
        observers.append(center.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.checkCompletion()
            self?.notifyListeners("foreground", data: [:])
        })
        observers.append(center.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: nil, queue: .main) { [weak self] _ in
            self?.players.removeAll(); self?.paths.removeAll()
            self?.notifyListeners("audioReset", data: [:])
        })
    }

    deinit { observers.forEach(NotificationCenter.default.removeObserver); completion?.invalidate() }

    private func resumeAudio() {
        guard running, !interrupted, !routePaused, deadline == nil || deadline! > Date().timeIntervalSince1970 else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
            players.values.filter { $0.volume > 0 }.forEach { $0.play() }
        } catch { notifyListeners("audioError", data: ["error": "audio_unavailable"]) }
    }

    private func silence() {
        players.values.forEach { $0.pause() }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func checkCompletion() {
        if running, let deadline, deadline <= Date().timeIntervalSince1970 {
            running = false; silence(); completion?.invalidate()
            notifyListeners("completed", data: ["deadline": deadline * 1000])
        }
    }

    @objc func sync(_ call: CAPPluginCall) {
        guard let value = call.getObject("state"), let isRunning = value["running"] as? Bool,
              let channels = value["channels"] as? [[String: Any]], channels.count <= 3 else { call.reject("invalid_session"); return }
        DispatchQueue.main.async {
            do {
                if let raw = value["journal"] as? String {
                    guard raw.utf8.count < 128_000, let data = raw.data(using: .utf8) else { call.reject("invalid_session"); return }
                    _ = try JSONSerialization.jsonObject(with: data)
                    try FileManager.default.createDirectory(at: self.journalURL.deletingLastPathComponent(), withIntermediateDirectories: true)
                    try data.write(to: self.journalURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
                } else if FileManager.default.fileExists(atPath: self.journalURL.path) { try FileManager.default.removeItem(at: self.journalURL) }
                let rawDeadline = (value["deadline"] as? Double).map { $0 / 1000 }
                if let rawDeadline, !rawDeadline.isFinite { call.reject("invalid_session"); return }
                if !self.running && isRunning || value["resumeAudio"] as? Bool == true { self.routePaused = false }
                self.running = isRunning
                self.deadline = rawDeadline
                let publicRoot = Bundle.main.bundleURL.appendingPathComponent("public")
                let wanted = Set(channels.compactMap { $0["id"] as? String })
                for id in Array(self.players.keys) where !wanted.contains(id) { self.players[id]?.stop(); self.players.removeValue(forKey: id); self.paths.removeValue(forKey: id) }
                for channel in channels {
                    guard let id = channel["id"] as? String, ["music", "ambient", "white"].contains(id),
                          let path = channel["path"] as? String, path.hasPrefix("assets/audio/"), !path.contains(".."), !path.contains("%"), !path.contains("\\"),
                          let volume = channel["volume"] as? Double, volume.isFinite else { call.reject("invalid_audio"); return }
                    if self.paths[id] != path {
                        self.players[id]?.stop()
                        let player = try AVAudioPlayer(contentsOf: publicRoot.appendingPathComponent(path))
                        player.numberOfLoops = -1; player.prepareToPlay()
                        self.players[id] = player; self.paths[id] = path
                    }
                    self.players[id]?.volume = Float(max(0, min(0.9, volume)))
                }
                self.completion?.invalidate()
                if isRunning, let end = self.deadline, end > Date().timeIntervalSince1970 {
                    self.completion = Timer.scheduledTimer(withTimeInterval: end - Date().timeIntervalSince1970, repeats: false) { [weak self] _ in self?.checkCompletion() }
                }
                self.checkCompletion()
                if self.running && !channels.isEmpty { self.resumeAudio() } else { self.silence() }
                self.scheduleNotification(enabled: value["notify"] as? Bool == true, sound: value["completionSound"] as? Bool != false)
                call.resolve(["ok": true, "audioPaused": self.routePaused])
            } catch { call.reject("session_sync_failed") }
        }
    }

    private func scheduleNotification(enabled: Bool, sound: Bool) {
        let center = UNUserNotificationCenter.current()
        guard enabled, running, let deadline, deadline > Date().timeIntervalSince1970 else {
            center.removePendingNotificationRequests(withIdentifiers: [notificationId]); lastNotification = nil; return
        }
        guard lastNotification != deadline else { return }
        lastNotification = deadline
        let content = UNMutableNotificationContent()
        content.title = "Focus complete"
        content.body = "Your time on the island is complete. Take a gentle break."
        if sound { content.sound = .default }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, deadline - Date().timeIntervalSince1970), repeats: false)
        center.add(UNNotificationRequest(identifier: notificationId, content: content, trigger: trigger)) { [weak self] error in
            if error != nil { DispatchQueue.main.async { self?.lastNotification = nil } }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        let data = try? Data(contentsOf: journalURL)
        call.resolve(["journal": data.flatMap { String(data: $0, encoding: .utf8) } as Any? ?? NSNull()])
    }

    @objc func notifications(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
            if error != nil { call.reject("notifications_unavailable") }
            else { call.resolve(["granted": granted]) }
        }
    }

    @objc func openLink(_ call: CAPPluginCall) {
        let links = ["privacy": "https://focusisle.online/privacy", "terms": "https://focusisle.online/terms", "support": "https://focusisle.online/contact", "subscriptions": "https://apps.apple.com/account/subscriptions"]
        guard let key = call.getString("key"), let link = links[key], let url = URL(string: link) else { call.reject("invalid_link"); return }
        DispatchQueue.main.async { UIApplication.shared.open(url, options: [:]) { opened in call.resolve(["opened": opened]) } }
    }
}
