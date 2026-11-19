import {expect,test} from '@playwright/test';

test('homepage, article and contact are full pages and link to the actual app',async({page,request})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Your immersive');
  await expect(page.locator('[data-app-link]').first()).toHaveAttribute('href','/app');
  await page.getByRole('button',{name:'Forest',exact:true}).click();
  await expect(page.locator('#mainScene')).toHaveAttribute('src','/website-assets/forest.webp');
  await page.getByRole('button',{name:'50 min focus',exact:true}).click();
  await page.getByRole('button',{name:'Start timer',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('#clock')).toHaveText('50:00');
  await page.goto('/blog/start-a-focus-session');
  await page.reload();
  await expect(page.locator('article.article')).toContainText('Choose an action you can see');
  await page.goto('/contact');
  await expect(page.getByRole('link',{name:'support@nisoniy.com',exact:true})).toHaveAttribute('href','mailto:support@nisoniy.com');
  const robots=await request.get('/robots.txt');
  expect(await robots.text()).toContain('Allow: /');
  const unknown=await request.get('/this-page-does-not-exist');
  expect(unknown.status()).toBe(404);
});

test('mobile homepage has no horizontal overflow and navigation works',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Toggle navigation'}).click();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Pricing',exact:true}).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole('heading',{level:1})).toContainText('Start with a quiet seat');
});
