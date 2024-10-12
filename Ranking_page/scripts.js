var albumBucketName = "hama-web-bucket";
var bucketRegion = "ap-northeast-2";
var IdentityPoolId = "ap-northeast-2:0c52fbc2-029c-40f7-8bd6-49680ea4a815";

let ranking_arr = [];

// API Gateway에서 제공되는 URL
const rankURL = "https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/Ranking_to_Seok";

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
        ranking_arr = data;  // 받아온 데이터를 ranking_arr에 저장
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
            <div class="ranking-view-content">
                <h3> ${index + 1}위</h3>
                <p>Player: ${player.player}</p>
                <p>Score: ${player.balance} $</p>
            </div>
        `;  // 순위, 플레이어 이름, 잔액을 li에 표시

        rankingList.appendChild(li);  // 생성한 li를 ul 태그에 추가하여 화면에 표시
    });
}

// 검색어를 바탕으로 랭킹을 필터링하는 함수
function filterRankings() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();  // 검색어를 소문자로 변환
    const filteredRanking = ranking_arr.filter(player => 
        player.player.toLowerCase().includes(searchInput)  // 유저네임에 검색어가 포함된 게시물 필터링
    );
    displayRankings(filteredRanking);  // 필터링된 게시물을 화면에 표시
}

// 페이지가 로드될 때 랭킹을 가져옴
window.onload = getRankings;
