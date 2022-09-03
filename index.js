const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

// вводим запрос сюда )
const searchString = 'лошадь';


(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://yandex.ru/images/search?text=${searchString}`);

  await page.waitForSelector('.serp-item__link');
  await page.click('.serp-item__link');
  await page.setViewport({
    width: 1200,
    height: 1200
  });

  await page.waitForSelector('.MMImage-Origin');
  await page.screenshot({ path: 'screenshot.png' });

  // собираем ссылки на изображения в один объект  
  let images = await page.evaluate(() => {
    let imgElements = document.querySelectorAll('.serp-item__thumb');
    let imgUrls = Object.values(imgElements).map(el =>
    ({
      src: el.src,
      alt: el.alt
    })
    )
    return imgUrls;
  })

  // записываем содержимое нашего объекта в json файл  
  fs.writeFile('imagesURL.json', JSON.stringify(images, null, ' '), err => {
    if (err) {
      console.log('error in write file: ' + err);
      return err;
    }
  });


  // загружаем картинки по ссылкам из json файла а папку
  images.forEach((el, idx)=>{
    const file = fs.createWriteStream(`images/${idx}_${el.alt}.webp`);
    const req = https.get(el.src, res => {
      console.log(`${idx}.webp .... is done!`);
      res.pipe(file);      
    })
  })

  await browser.close;

})()