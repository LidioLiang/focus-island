import {expect,test} from '@playwright/test';

test('homepage, article and contact are full pages and link to the actual app',async({page,request})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Find your quiet.');
  await expect(page.locator('[data-app-link]').first()).toHaveAttribute('href','/app');
  await expect(page.locator('.review-card')).toHaveCount(6);
  await expect(page.getByRole('button',{name:'Show all 10 reviews'})).toHaveCount(0);
  await page.getByRole('button',{name:'Forest',exact:true}).click();
  await expect(page.locator('#galleryLabel')).toHaveText('Forest');
  await page.locator('.benefit-image').click();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('button',{name:'50 min',exact:true}).click();
  await page.getByRole('button',{name:'Start',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'Open navigation'}).click();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Features',exact:true}).click();
  await expect(page.getByRole('button',{name:'Open navigation'})).toHaveAttribute('aria-expanded','false');
  await page.getByRole('navigation',{name:'Footer navigation'}).getByRole('link',{name:'Pricing',exact:true}).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole('heading',{level:1})).toContainText('Start with a quiet seat');
});
