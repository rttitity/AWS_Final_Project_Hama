var albumBucketName = "hama-web-bucket";
var bucketRegion = "ap-northeast-2";
var IdentityPoolId = "ap-northeast-2:0c52fbc2-029c-40f7-8bd6-49680ea4a815";
let currentPage = 1;
const articlesPerPage = 10;

let article_arr = [];

// API Gateway에서 제공되는 URL
const rankURL = "https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/Ranking";


// 플레이어 랭킹을 가져오는 함수
function getRankings() {
    fetch(rankURL, {
        method: "GET",
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(resp => resp.json())  // 응답을 JSON 형식으로 파싱
    .then(function(data) {
        displayRankings(data);  // 가져온 데이터를 화면에 표시
    })
    .catch(err => console.log(err));  // 오류가 발생하면 콘솔에 출력
}

// 플레이어 랭킹 목록을 화면에 표시하는 함수
function displayRankings(players) {
    const rankingList = document.getElementById('rankings');  // 랭킹을 표시할 ul 태그 선택
    rankingList.innerHTML = '';  // 기존에 표시된 랭킹 목록 초기화

    players.forEach(function(player, index) {  // 각 플레이어에 대해 반복 처리
        let li = document.createElement('li');  // 새로운 li 태그 생성
        li.classList.add('ranking-item');  // CSS 클래스 추가

        li.innerHTML = `
            <div class="ranking-rank">${index + 1}위</div>
            <div class="ranking-player">${player.player}</div>
            <div class="ranking-balance">${player.balance} 점</div>
        `;  // 순위, 플레이어 이름, 잔액을 li에 표시

        rankingList.appendChild(li);  // 생성한 li를 ul 태그에 추가하여 화면에 표시
    });
}

// 페이지가 로드될 때 랭킹을 가져옴
window.onload = getRankings;