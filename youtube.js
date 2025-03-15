const express = require('express');
const router = express.Router();

const puppeteer = require('puppeteer');
const { exec } = require("child_process"); // 검색만 puppeteer로, 실행은 exec

// let pages=[]
// let cnt=1;
let browser;

async function searchYouTube(term) {
    
    try{
        if(browser) browser.close();

        browser = await puppeteer.launch({ 
            headless: false, 
            defaultViewport: null,
            args: [
                // '--autoplay-policy=no-user-gesture-required', // 자동 재생 허용
                // '--disable-background-timer-throttling', // 백그라운드 리소스 제한 해제
                // '--disable-backgrounding-occluded-windows', // 창이 가려져도 실행 유지
                // '--disable-renderer-backgrounding', // 렌더링 제한 해제
                '--start-maximized'
            ] // 브라우저를 최대화
            // args: ['--window-size=1920,1080'] // 브라우저 창 크기 설정
        });

        const page = await browser.newPage(); // 신규 탭(페이지) 생성
        // await page.setUserAgent(
        //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        // );
        // await page.setRequestInterception(true);
        // page.on('request', (req) => {
        //     if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        //         req.abort(); // 불필요한 리소스 차단
        //     } else {
        //         req.continue();
        //     }
        // });


        // 유튜브 열기
        await page.goto(`https://www.youtube.com/results?search_query=${term}`);

        // 검색 결과가 로드될 때까지 대기
        await page.waitForSelector('#contents'); 

        // 영상 목록 가져오기
        const videos = await page.$$eval('ytd-video-renderer ytd-thumbnail a', (links) => {
            return links.map(link => link.href); // 영상 링크만 가져옴
        });

        if (videos.length === 0) {
            console.log('No videos found');
            return;
        }
        // 임의로 하나의 영상 선택
        const randomVideoUrl = videos[Math.floor(Math.random() * videos.length)];
        console.log(`Selecting video: ${randomVideoUrl}`);

        // // 선택한 영상 클릭
        // await page.goto(randomVideoUrl);
        // // 영상이 로드될 때까지 대기
        // await page.waitForSelector('.html5-video-container');
        
        // 웹 브라우저로 유튜브 URL 열기
        browser.close();
        browser=null;
        exec(`start chrome "${randomVideoUrl}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`exec error: ${err}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });


    } catch(e){
        console.error("youtube_api_error: ", e);
    }
}


router.get("/search", async(req, res)=>{
    const term = req.query.term;
    console.log(term);
    searchYouTube(term);
    // res.send(youtube_page);
    res.send("success");
});

module.exports = router;

