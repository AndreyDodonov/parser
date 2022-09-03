const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

// вводим запрос сюда )
const searchString = 'лошадь';



(async () => {
  // проверяем папку images
  fs.stat('images', (err) => {
    if (!err) {
      console.log('directory exists');
    } else if (err.code === 'ENOENT') {
      console.log('no such directory');
      fs.mkdir('images', () => {
        console.log('directory was created');
      });

    }
  })

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://yandex.ru/images/search?text=${searchString}`);

  await page.waitForSelector('.serp-item__link');
  await page.click('.serp-item__link');
  await page.setViewport({
    width: 1200,
    height: 200
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
  images.forEach((el, idx) => {
    const file = fs.createWriteStream(`images/${idx}_${searchString}.webp`);
    const req = https.get(el.src, res => {
      console.log(`${idx}__${searchString}.webp .... is done!`);
      res.pipe(file);
    })
  })

  await browser.close;

})();