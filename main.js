const { useState, useEffect, useMemo } = React;

const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const getChosung = (char) => {
    const code = char.charCodeAt(0) - 44032;
    if (code > -1 && code < 11172) {
        return CHOSUNG_LIST[Math.floor(code / 588)];
    }
    return char;
};

const chunkText = (text) => {
    if (!text) return [];
    return text.split(/([,.]?\s+)/).filter(s => s.trim().length > 0);
};

const processTextForTesting = (text, type) => {
    return text.split(' ').map(word => {
        let cleanWord = word;
        let punctuation = '';
        
        if (/[.,!?~)]$/.test(word)) {
            const match = word.match(/([.,!?~)]+)$/);
            if (match) {
                punctuation = match[0];
                cleanWord = word.slice(0, -punctuation.length);
            }
        }
        let prefix = '';
        if (/^[(]/.test(cleanWord)) {
            prefix = cleanWord[0];
            cleanWord = cleanWord.slice(1);
        }

        if (cleanWord.length === 0) return word;

        let processed = cleanWord;

        if (type === 'hint') {
            if (cleanWord.length > 1) {
                processed = cleanWord[0] + '*'.repeat(cleanWord.length - 1);
            }
        } else if (type === 'chosung') {
            processed = cleanWord.split('').map(getChosung).join('');
        } else if (type === 'masked') {
            processed = '*'.repeat(cleanWord.length);
        }

        return prefix + processed + punctuation;
    }).join(' ');
};

// 153 구절 데이터 (개별 절로 분리)
const RAW_DATA = [
    // 1. 세상창조와 인간창조 (5구절)
    { cat: "1. 세상창조와 인간창조", ref: "창 1:1", text: "태초에 하나님이 천지를 창조하시니라" },
    { cat: "1. 세상창조와 인간창조", ref: "골 1:16", text: "만물이 그에게서 창조되되 하늘과 땅에서 보이는 것들과 보이지 않는 것들과 혹은 왕권들이나 주권들이나 통치자들이나 권세들이나 만물이 다 그로 말미암고 그를 위하여 창조되었고" },
    { cat: "1. 세상창조와 인간창조", ref: "창 1:26", text: "하나님이 이르시되 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그들로 바다의 물고기와 하늘의 새와 가축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고" },
    { cat: "1. 세상창조와 인간창조", ref: "창 1:27", text: "하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고" },
    { cat: "1. 세상창조와 인간창조", ref: "창 1:28", text: "하나님이 그들에게 복을 주시며 하나님이 그들에게 이르시되 생육하고 번성하여 땅에 충만하라 땅을 정복하라 바다의 물고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라" },
    { cat: "1. 세상창조와 인간창조", ref: "창 1:31", text: "하나님이 지으신 그 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라" },
    { cat: "1. 세상창조와 인간창조", ref: "창 2:7", text: "여호와 하나님이 땅의 흙으로 사람을 지으시고 생기를 그 코에 불어 넣으시니 사람이 생령이 되니라" },
    
    // 2. 하나님의 법 (2구절)
    { cat: "2. 하나님의 법", ref: "창 2:16", text: "여호와 하나님이 그 사람에게 명하여 이르시되 동산 각종 나무의 열매는 네가 임의로 먹되" },
    { cat: "2. 하나님의 법", ref: "창 2:17", text: "선악을 알게 하는 나무의 열매는 먹지 말라 네가 먹는 날에는 반드시 죽으리라 하시니라" },
    
    // 3. 죄와 벌 (6구절)
    { cat: "3. 죄와 벌", ref: "창 3:1", text: "그런데 뱀은 여호와 하나님이 지으신 들짐승 중에 가장 간교하니라 뱀이 여자에게 물어 이르되 하나님이 참으로 너희에게 동산 모든 나무의 열매를 먹지 말라 하시더냐" },
    { cat: "3. 죄와 벌", ref: "창 3:2", text: "여자가 뱀에게 말하되 동산 나무의 열매를 우리가 먹을 수 있으나" },
    { cat: "3. 죄와 벌", ref: "창 3:3", text: "동산 중앙에 있는 나무의 열매는 하나님의 말씀에 너희는 먹지도 말고 만지지도 말라 너희가 죽을까 하노라 하셨느니라" },
    { cat: "3. 죄와 벌", ref: "창 3:4", text: "뱀이 여자에게 이르되 너희가 결코 죽지 아니하리라" },
    { cat: "3. 죄와 벌", ref: "창 3:5", text: "너희가 그것을 먹는 날에는 너희 눈이 밝아져 하나님과 같이 되어 선악을 알 줄을 하나님이 아심이니라" },
    { cat: "3. 죄와 벌", ref: "롬 5:12", text: "그러므로 한 사람으로 말미암아 죄가 세상에 들어오고 죄로 말미암아 사망이 들어왔나니 이와 같이 모든 사람이 죄를 지었으므로 사망이 모든 사람에게 이르렀느니라" },
    
    // 4. 인생의 문제와 해답 (5구절)
    { cat: "4. 인생의 문제와 해답", ref: "창 3:15", text: "내가 너로 여자와 원수가 되게 하고 네 후손도 여자의 후손과 원수가 되게 하리니 여자의 후손은 네 머리를 상하게 할 것이요 너는 그의 발꿈치를 상하게 할 것이니라 하시고" },
    { cat: "4. 인생의 문제와 해답", ref: "창 3:21", text: "여호와 하나님이 아담과 그의 아내를 위하여 가죽 옷을 지어 입히시니라" },
    { cat: "4. 인생의 문제와 해답", ref: "창 4:15", text: "여호와께서 그에게 이르시되 그렇지 아니하다 가인을 죽이는 자는 벌을 칠 배나 받으리라 하시고 가인에게 표를 주사 그를 만나는 모든 사람에게서 죽임을 면하게 하시니라" },
    { cat: "4. 인생의 문제와 해답", ref: "행 4:12", text: "다른 이로써는 구원을 받을 수 없나니 천하 사람 중에 구원을 받을 만한 다른 이름을 우리에게 주신 일이 없음이라 하였더라" },
    { cat: "4. 인생의 문제와 해답", ref: "행 16:31", text: "이르되 주 예수를 믿으라 그리하면 너와 네 집이 구원을 받으리라 하고" },
    
    // 5. 하나님의 동행 (7구절)
    { cat: "5. 하나님의 동행", ref: "창 5:24", text: "에녹이 하나님과 동행하더니 하나님이 그를 데려가시므로 세상에 있지 아니하였더라" },
    { cat: "5. 하나님의 동행", ref: "창 6:9", text: "이것이 노아의 족보니라 노아는 의인이요 당대에 완전한 자라 그는 하나님과 동행하였으며" },
    { cat: "5. 하나님의 동행", ref: "창 17:1", text: "아브람이 구십구 세 때에 여호와께서 아브람에게 나타나서 그에게 이르시되 나는 전능한 하나님이라 너는 내 앞에서 행하여 완전하라" },
    { cat: "5. 하나님의 동행", ref: "마 1:23", text: "보라 처녀가 잉태하여 아들을 낳을 것이요 그의 이름은 임마누엘이라 하리라 하셨으니 이를 번역한즉 하나님이 우리와 함께 계시다 함이라" },
    { cat: "5. 하나님의 동행", ref: "계 21:3", text: "내가 들으니 보좌에서 큰 음성이 나서 이르되 보라 하나님의 장막이 사람들과 함께 있으매 하나님이 그들과 함께 계시리니 그들은 하나님의 백성이 되고 하나님은 친히 그들과 함께 계셔서" },
    { cat: "5. 하나님의 동행", ref: "계 21:4", text: "모든 눈물을 그 눈에서 닦아 주시니 다시는 사망이 없고 애통하는 것이나 곡하는 것이나 아픈 것이 다시 있지 아니하리니 처음 것들이 다 지나갔음이러라" },
    
    // 6. 하나님의 약속 (6구절)
    { cat: "6. 하나님의 약속", ref: "창 12:1", text: "여호와께서 아브람에게 이르시되 너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라" },
    { cat: "6. 하나님의 약속", ref: "창 12:2", text: "내가 너로 큰 민족을 이루고 네게 복을 주어 네 이름을 창대하게 하리니 너는 복이 될지라" },
    { cat: "6. 하나님의 약속", ref: "창 12:3", text: "너를 축복하는 자에게는 내가 복을 내리고 너를 저주하는 자에게는 내가 저주하리니 땅의 모든 족속이 너로 말미암아 복을 얻을 것이라 하신지라" },
    { cat: "6. 하나님의 약속", ref: "창 26:2", text: "여호와께서 이삭에게 나타나 이르시되 애굽으로 내려가지 말고 내가 네게 지시하는 땅에 거주하라" },
    { cat: "6. 하나님의 약속", ref: "창 26:3", text: "이 땅에 거류하면 내가 너와 함께 있어 네게 복을 주고 내가 이 모든 땅을 너와 네 자손에게 주리라 내가 네 아버지 아브라함에게 맹세한 것을 이루어" },
    { cat: "6. 하나님의 약속", ref: "창 26:4", text: "네 자손을 하늘의 별과 같이 번성하게 하며 이 모든 땅을 네 자손에게 주리니 네 자손으로 말미암아 천하 만민이 복을 받으리라" },
    { cat: "6. 하나님의 약속", ref: "창 28:15", text: "내가 너와 함께 있어 네가 어디로 가든지 너를 지키며 너를 이끌어 이 땅으로 돌아오게 할지라 내가 네게 허락한 것을 다 이루기까지 너를 떠나지 아니하리라 하신지라" },
    
    // 7. 하나님의 약속 체현 (1구절)
    { cat: "7. 하나님의 약속 체현", ref: "창 50:20", text: "당신들은 나를 해하려 하였으나 하나님은 그것을 선으로 바꾸사 오늘과 같이 많은 백성의 생명을 구원하게 하시려 하셨나니" },
    
    // 8. 소명과 사명 (7구절)
    { cat: "8. 소명과 사명", ref: "출 3:4", text: "여호와께서 그가 보려고 돌이켜 오는 것을 보신지라 하나님이 떨기나무 가운데서 그를 불러 이르시되 모세야 모세야 하시매 그가 이르되 내가 여기 있나이다" },
    { cat: "8. 소명과 사명", ref: "출 3:9", text: "이제 이스라엘 자손의 부르짖음이 내게 달하고 애굽 사람이 그들을 괴롭히는 학대도 내가 보았으니" },
    { cat: "8. 소명과 사명", ref: "출 3:10", text: "이제 내가 너를 바로에게 보내어 너에게 내 백성 이스라엘 자손을 애굽에서 인도하여 내게 하리라" },
    { cat: "8. 소명과 사명", ref: "사 6:8", text: "내가 또 주의 목소리를 들으니 주께서 이르시되 내가 누구를 보내며 누가 우리를 위하여 갈꼬 하시니 그 때에 내가 이르되 내가 여기 있나이다 나를 보내소서 하였더니" },
    { cat: "8. 소명과 사명", ref: "욘 1:2", text: "너는 일어나 저 큰 성읍 니느웨로 가서 그것을 향하여 외치라 그 악독이 내 앞에 상달되었음이니라 하시니라" },
    { cat: "8. 소명과 사명", ref: "마 4:19", text: "말씀하시되 나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라 하시니" },
    { cat: "8. 소명과 사명", ref: "벧전 2:9", text: "그러나 너희는 택하신 족속이요 왕 같은 제사장들이요 거룩한 나라요 그의 소유가 된 백성이니 이는 너희를 어두운 데서 불러 내어 그의 기이한 빛에 들어가게 하신 이의 아름다운 덕을 선포하게 하려 하심이라" },
    
    // 9. 하나님의 신앙 시스템 (16구절)
    { cat: "9. 하나님의 신앙 시스템", ref: "신 6:4", text: "이스라엘아 들으라 우리 하나님 여호와는 오직 유일한 여호와이시니" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 6:5", text: "너는 마음을 다하고 뜻을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 6:6", text: "오늘 내가 네게 명하는 이 말씀을 너는 마음에 새기고" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 6:7", text: "네 자녀에게 부지런히 가르치며 집에 앉았을 때에든지 길을 갈 때에든지 누워 있을 때에든지 일어날 때에든지 이 말씀을 강론할 것이며" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 6:8", text: "너는 또 그것을 네 손목에 매어 기호를 삼으며 네 미간에 붙여 표로 삼고" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 6:9", text: "또 네 집 문설주와 바깥 문에 기록할지니라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 8:2", text: "네 하나님 여호와께서 이 사십 년 동안에 네게 광야 길을 걷게 하신 것을 기억하라 이는 너를 낮추시며 너를 시험하사 네 마음이 어떠한지 그 명령을 지키는지 지키지 않는지 알려 하심이라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 8:3", text: "너를 낮추시며 너를 주리게 하시며 또 너도 알지 못하며 네 조상들도 알지 못하던 만나를 네게 먹이신 것은 사람이 떡으로만 사는 것이 아니요 여호와의 입에서 나오는 모든 말씀으로 사는 줄을 네가 알게 하려 하심이니라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 28:1", text: "네가 네 하나님 여호와의 말씀을 삼가 듣고 내가 오늘 네게 명령하는 그의 모든 명령을 지켜 행하면 네 하나님 여호와께서 너를 세계 모든 민족 위에 뛰어나게 하실 것이라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "신 28:15", text: "네가 만일 네 하나님 여호와의 말씀을 순종하지 아니하여 내가 오늘 네게 명령하는 그의 모든 명령과 규례를 지켜 행하지 아니하면 이 모든 저주가 네게 임하며 네게 이를 것이니" },
    { cat: "9. 하나님의 신앙 시스템", ref: "시 1:1", text: "복 있는 사람은 악인들의 꾀를 따르지 아니하며 죄인들의 길에 서지 아니하며 오만한 자들의 자리에 앉지 아니하고" },
    { cat: "9. 하나님의 신앙 시스템", ref: "시 1:2", text: "오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다" },
    { cat: "9. 하나님의 신앙 시스템", ref: "시 119:105", text: "주의 말씀은 내 발에 등이요 내 길에 빛이니이다" },
    { cat: "9. 하나님의 신앙 시스템", ref: "스 7:10", text: "에스라가 여호와의 율법을 연구하여 준행하며 율례와 규례를 이스라엘에게 가르치기로 결심하였었더라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "딤후 4:2", text: "너는 말씀을 전파하라 때를 얻든지 못 얻든지 항상 힘쓰라 범사에 오래 참음과 가르침으로 경책하며 경계하며 권하라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "행 5:42", text: "그들이 날마다 성전에 있든지 집에 있든지 예수는 그리스도라고 가르치기와 전도하기를 그치지 아니하니라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "계 10:9", text: "내가 천사에게 나아가 작은 두루마리를 달라 한즉 천사가 이르되 갖다 먹어 버리라 네 배에는 쓰나 네 입에는 꿀 같이 달리라 하거늘" },
    { cat: "9. 하나님의 신앙 시스템", ref: "계 10:10", text: "내가 천사의 손에서 작은 두루마리를 갖다 먹어 버리니 내 입에는 꿀 같이 다나 먹은 후에 내 배에서는 쓰게 되더라" },
    { cat: "9. 하나님의 신앙 시스템", ref: "계 10:11", text: "그가 내게 말하기를 네가 많은 백성과 나라와 방언과 임금에게 다시 예언하여야 하리라 하더라" },
    
    // 10. 하나님의 사랑(1) (9구절)
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:1", text: "야곱아 너를 창조하신 여호와께서 지금 말씀하시느니라 이스라엘아 너를 지으신 이가 말씀하시느니라 너는 두려워하지 말라 내가 너를 구속하였고 내가 너를 지명하여 불렀나니 너는 내 것이라" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:2", text: "네가 물 가운데로 지날 때에 내가 너와 함께 할 것이라 강을 건널 때에 물이 너를 침몰하지 못할 것이며 네가 불 가운데로 지날 때에 타지도 아니할 것이요 불꽃이 너를 사르지도 못하리니" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:3", text: "대저 나는 여호와 네 하나님이요 이스라엘의 거룩한 이요 네 구원자임이라 내가 애굽을 너의 속량물로, 구스와 스바를 너를 대신하여 주었노라" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:4", text: "네가 내 눈에 보배롭고 존귀하며 내가 너를 사랑하였은즉 내가 네 대신 사람들을 내어 주며 백성들이 네 생명을 대신하리니" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:5", text: "두려워하지 말라 내가 너와 함께 하여 네 자손을 동쪽에서부터 오게 하며 서쪽에서부터 너를 모을 것이며" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:6", text: "내가 북쪽에게 이르기를 내놓으라 남쪽에게 이르기를 가두어 두지 말라 내 아들들을 먼 곳에서 이끌며 내 딸들을 땅 끝에서 오게 하며" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 43:7", text: "내 이름으로 불려지는 모든 자 곧 내가 내 영광을 위하여 창조한 자를 오게 하라 그를 내가 지었고 그를 내가 만들었느니라" },
    { cat: "10. 하나님의 사랑(1)", ref: "사 41:10", text: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라" },
    
    // 11. 하나님의 사랑(2) (9구절)
    { cat: "11. 하나님의 사랑(2)", ref: "요 3:16", text: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라" },
    { cat: "11. 하나님의 사랑(2)", ref: "사 9:6", text: "이는 한 아기가 우리에게 났고 한 아들을 우리에게 주신 바 되었는데 그의 어깨에는 정사를 메었고 그의 이름은 기묘자라, 모사라, 전능하신 하나님이라, 영존하시는 아버지라, 평강의 왕이라 할 것임이라" },
    { cat: "11. 하나님의 사랑(2)", ref: "미 5:2", text: "베들레헴 에브라다야 너는 유다 족속 중에 작을지라도 이스라엘을 다스릴 자가 네게서 내게로 나올 것이라 그의 근본은 상고에, 영원에 있느니라" },
    { cat: "11. 하나님의 사랑(2)", ref: "요 1:14", text: "말씀이 육신이 되어 우리 가운데 거하시매 우리가 그의 영광을 보니 아버지의 독생자의 영광이요 은혜와 진리가 충만하더라" },
    { cat: "11. 하나님의 사랑(2)", ref: "마 1:21", text: "아들을 낳으리니 이름을 예수라 하라 이는 그가 자기 백성을 그들의 죄에서 구원할 자이심이라 하니라" },
    { cat: "11. 하나님의 사랑(2)", ref: "롬 8:1", text: "그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니" },
    { cat: "11. 하나님의 사랑(2)", ref: "롬 8:2", text: "이는 그리스도 예수 안에 있는 생명의 성령의 법이 죄와 사망의 법에서 너를 해방하였음이라" },
    { cat: "11. 하나님의 사랑(2)", ref: "요일 4:9", text: "하나님의 사랑이 우리에게 이렇게 나타난 바 되었으니 하나님이 자기의 독생자를 세상에 보내심은 그로 말미암아 우리를 살리려 하심이라" },
    
    // 12. 하나님의 사랑(3) (6구절)
    { cat: "12. 하나님의 사랑(3)", ref: "마 11:28", text: "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라" },
    { cat: "12. 하나님의 사랑(3)", ref: "요 14:6", text: "예수께서 이르시되 내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라" },
    { cat: "12. 하나님의 사랑(3)", ref: "요 11:25", text: "예수께서 이르시되 나는 부활이요 생명이니 나를 믿는 자는 죽어도 살겠고" },
    { cat: "12. 하나님의 사랑(3)", ref: "요 11:26", text: "무릇 살아서 나를 믿는 자는 영원히 죽지 아니하리니 이것을 네가 믿느냐" },
    { cat: "12. 하나님의 사랑(3)", ref: "고전 15:3", text: "내가 받은 것을 먼저 너희에게 전하였노니 이는 성경대로 그리스도께서 우리 죄를 위하여 죽으시고" },
    { cat: "12. 하나님의 사랑(3)", ref: "고전 15:4", text: "장사 지낸 바 되셨다가 성경대로 사흘 만에 다시 살아나사" },
    
    // 13. 하나님의 사랑(4) (7구절)
    { cat: "13. 하나님의 사랑(4)", ref: "요 14:16", text: "내가 아버지께 구하겠으니 그가 또 다른 보혜사를 너희에게 주사 영원토록 너희와 함께 있게 하리니" },
    { cat: "13. 하나님의 사랑(4)", ref: "요 14:17", text: "그는 진리의 영이라 세상은 능히 그를 받지 못하나니 이는 그를 보지도 못하고 알지도 못함이라 그러나 너희는 그를 아나니 그는 너희와 함께 거하심이요 또 너희 속에 계시겠음이라" },
    { cat: "13. 하나님의 사랑(4)", ref: "요 14:18", text: "내가 너희를 고아와 같이 버려두지 아니하고 너희에게로 오리라" },
    { cat: "13. 하나님의 사랑(4)", ref: "요 14:26", text: "보혜사 곧 아버지께서 내 이름으로 보내실 성령 그가 너희에게 모든 것을 가르치고 내가 너희에게 말한 모든 것을 생각나게 하리라" },
    { cat: "13. 하나님의 사랑(4)", ref: "요 14:27", text: "평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라 너희는 마음에 근심하지도 말고 두려워하지도 말라" },
    { cat: "13. 하나님의 사랑(4)", ref: "행 1:8", text: "오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라" },
    { cat: "13. 하나님의 사랑(4)", ref: "계 2:7", text: "귀 있는 자는 성령이 교회들에게 하시는 말씀을 들을지어다 이기는 그에게는 내가 하나님의 낙원에 있는 생명나무의 열매를 주어 먹게 하리라" },
    
    // 14. 하나님의 사랑(5) (1구절)
    { cat: "14. 하나님의 사랑(5)", ref: "골 3:10", text: "새 사람을 입었으니 이는 자기를 창조하신 이의 형상을 따라 지식에까지 새롭게 하심을 입은 자니라" },
    
    // 15. 그리스도인의 확신 (6구절)
    { cat: "15. 그리스도인의 확신", ref: "요 1:12", text: "영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니" },
    { cat: "15. 그리스도인의 확신", ref: "엡 2:8", text: "너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니 이것은 너희에게서 난 것이 아니요 하나님의 선물이라" },
    { cat: "15. 그리스도인의 확신", ref: "사 53:6", text: "우리는 다 양 같아서 그릇 행하여 각기 제 길로 갔거늘 여호와께서는 우리 모두의 죄악을 그에게 담당시키셨도다" },
    { cat: "15. 그리스도인의 확신", ref: "빌 3:20", text: "그러나 우리의 시민권은 하늘에 있는지라 거기로부터 구원하는 자 곧 주 예수 그리스도를 기다리노니" },
    { cat: "15. 그리스도인의 확신", ref: "요 14:14", text: "내 이름으로 무엇이든지 내게 구하면 내가 행하리라" },
    { cat: "15. 그리스도인의 확신", ref: "눅 10:19", text: "내가 너희에게 뱀과 전갈을 밟으며 원수의 모든 능력을 제어할 권능을 주었으니 너희를 해칠 자가 결코 없으리라" },
    
    // 16. 하나님의 나라 (4구절)
    { cat: "16. 하나님의 나라", ref: "시 117:1", text: "너희 모든 나라들아 여호와를 찬양하며 너희 모든 백성들아 그를 찬송할지어다" },
    { cat: "16. 하나님의 나라", ref: "시 117:2", text: "우리에게 향하신 여호와의 인자하심이 크시고 여호와의 진실하심이 영원함이로다 할렐루야" },
    { cat: "16. 하나님의 나라", ref: "행 1:3", text: "그가 고난 받으신 후에 또한 그들에게 확실한 많은 증거로 친히 살아 계심을 나타내사 사십 일 동안 그들에게 보이시며 하나님 나라의 일을 말씀하시니라" },
    
    // 17. 하나님나라를 위한 성령충만 (12구절)
    { cat: "17. 하나님나라를 위한 성령충만", ref: "행 1:4", text: "사도와 함께 모이사 그들에게 분부하여 이르시되 예루살렘을 떠나지 말고 내게서 들은 바 아버지께서 약속하신 것을 기다리라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "행 1:5", text: "요한은 물로 세례를 베풀었으나 너희는 몇 날이 못 되어 성령으로 세례를 받으리라 하셨느니라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "엡 5:18", text: "술 취하지 말라 이는 방탕한 것이니 오직 성령으로 충만함을 받으라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "행 10:44", text: "베드로가 이 말을 할 때에 성령이 말씀 듣는 모든 사람에게 내려오시니" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "눅 11:9", text: "내가 또 너희에게 이르노니 구하라 그러면 너희에게 주실 것이요 찾으라 그러면 찾아낼 것이요 문을 두드리라 그러면 너희에게 열릴 것이니" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "눅 11:10", text: "구하는 이마다 받을 것이요 찾는 이는 찾아낼 것이요 두드리는 이에게는 열릴 것이니라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "눅 11:11", text: "너희 중에 아버지 된 자로서 누가 아들이 생선을 달라 하는데 생선 대신에 뱀을 주며" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "눅 11:12", text: "알을 달라 하는데 전갈을 주겠느냐" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "눅 11:13", text: "너희가 악할지라도 좋은 것을 자식에게 줄 줄 알거든 하물며 너희 하늘 아버지께서 구하는 자에게 성령을 주시지 않겠느냐 하시니라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "행 4:31", text: "빌기를 다하매 모인 곳이 진동하더니 무리가 다 성령이 충만하여 담대히 하나님의 말씀을 전하니라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "행 5:32", text: "우리는 이 일에 증인이요 하나님이 자기에게 순종하는 사람들에게 주신 성령도 그러하니라 하더라" },
    { cat: "17. 하나님나라를 위한 성령충만", ref: "막 16:20", text: "제자들이 나가 두루 전파할새 주께서 함께 역사하사 그 따르는 표적으로 말씀을 확실히 증언하시니라" },
    
    // 18. 하나님나라를 위한 교회탄생 (7구절)
    { cat: "18. 하나님나라를 위한 교회탄생", ref: "마 16:16", text: "시몬 베드로가 대답하여 이르되 주는 그리스도시요 살아 계신 하나님의 아들이시니이다" },
    { cat: "18. 하나님나라를 위한 교회탄생", ref: "마 16:17", text: "예수께서 대답하여 이르시되 바요나 시몬아 네가 복이 있도다 이를 네게 알게 한 이는 혈육이 아니요 하늘에 계신 내 아버지시니라" },
    { cat: "18. 하나님나라를 위한 교회탄생", ref: "마 16:18", text: "또 내가 네게 이르노니 너는 베드로라 내가 이 반석 위에 내 교회를 세우리니 음부의 권세가 이기지 못하리라" },
    { cat: "18. 하나님나라를 위한 교회탄생", ref: "행 2:47", text: "하나님을 찬미하며 또 온 백성에게 칭송을 받으니 주께서 구원 받는 사람을 날마다 더하게 하시니라" },
    { cat: "18. 하나님나라를 위한 교회탄생", ref: "행 6:7", text: "하나님의 말씀이 점점 왕성하여 예루살렘에 있는 제자의 수가 더 심히 많아지고 허다한 제사장의 무리도 이 도에 복종하니라" },
    { cat: "18. 하나님나라를 위한 교회탄생", ref: "행 11:21", text: "주의 손이 그들과 함께 하시매 수많은 사람들이 믿고 주께 돌아오더라" },
    
    // 19. 하나님나라를 위한 제자훈련 (3구절)
    { cat: "19. 하나님나라를 위한 제자훈련", ref: "마 28:18", text: "예수께서 나아와 말씀하여 이르시되 하늘과 땅의 모든 권세를 내게 주셨으니" },
    { cat: "19. 하나님나라를 위한 제자훈련", ref: "마 28:19", text: "그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고" },
    { cat: "19. 하나님나라를 위한 제자훈련", ref: "마 28:20", text: "내가 너희에게 분부한 모든 것을 가르쳐 지키게 하라 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라" },
    
    // 20. 행복자 (7구절)
    { cat: "20. 행복자", ref: "히 11:40", text: "이는 하나님이 우리를 위하여 더 좋은 것을 예비하셨은즉 우리가 아니면 그들로 온전함을 이루지 못하게 하려 하심이라" },
    { cat: "20. 행복자", ref: "딤후 4:5", text: "그러나 너는 모든 일에 신중하여 고난을 받으며 전도자의 일을 하며 네 직무를 다하라" },
    { cat: "20. 행복자", ref: "딤후 4:6", text: "전제와 같이 내가 벌써 부어지고 나의 떠날 시각이 가까웠도다" },
    { cat: "20. 행복자", ref: "딤후 4:7", text: "나는 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니" },
    { cat: "20. 행복자", ref: "딤후 4:8", text: "이제 후로는 나를 위하여 의의 면류관이 예비되었으므로 주 곧 의로우신 재판장이 그 날에 내게 주실 것이며 내게만 아니라 주의 나타나심을 사모하는 모든 자에게도니라" },
    { cat: "20. 행복자", ref: "단 12:3", text: "지혜 있는 자는 궁창의 빛과 같이 빛날 것이요 많은 사람을 옳은 데로 돌아오게 한 자는 별과 같이 영원토록 빛나리라" },
    
    // 21. 우리의 결단 (9구절)
    { cat: "21. 우리의 결단", ref: "고전 15:58", text: "그러므로 내 사랑하는 형제들아 견실하며 흔들리지 말고 항상 주의 일에 더욱 힘쓰는 자들이 되라 이는 너희 수고가 주 안에서 헛되지 않은 줄 앎이라" },
    { cat: "21. 우리의 결단", ref: "살전 5:16", text: "항상 기뻐하라" },
    { cat: "21. 우리의 결단", ref: "살전 5:17", text: "쉬지 말고 기도하라" },
    { cat: "21. 우리의 결단", ref: "살전 5:18", text: "범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라" },
    { cat: "21. 우리의 결단", ref: "마 6:33", text: "그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라" },
    { cat: "21. 우리의 결단", ref: "롬 14:8", text: "우리가 살아도 주를 위하여 살고 죽어도 주를 위하여 죽나니 그러므로 사나 죽으나 우리가 주의 것이로다" },
    { cat: "21. 우리의 결단", ref: "고전 11:1", text: "내가 그리스도를 본받는 자가 된 것 같이 너희는 나를 본받는 자가 되라" },
    { cat: "21. 우리의 결단", ref: "계 1:3", text: "이 예언의 말씀을 읽는 자와 듣는 자들과 그 가운데에 기록한 것을 지키는 자는 복이 있나니 때가 가까움이라" },
    { cat: "21. 우리의 결단", ref: "계 22:7", text: "보라 내가 속히 오리니 이 두루마리의 예언의 말씀을 지키는 자는 복이 있으리라 하더라" },
    
    // 22. 우리의 신앙고백 (17구절)
    { cat: "22. 우리의 신앙고백", ref: "시 23:1", text: "여호와는 나의 목자시니 내게 부족함이 없으리로다" },
    { cat: "22. 우리의 신앙고백", ref: "시 23:2", text: "그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다" },
    { cat: "22. 우리의 신앙고백", ref: "시 23:3", text: "내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다" },
    { cat: "22. 우리의 신앙고백", ref: "시 23:4", text: "내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다" },
    { cat: "22. 우리의 신앙고백", ref: "시 23:5", text: "주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다" },
    { cat: "22. 우리의 신앙고백", ref: "시 23:6", text: "내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다" },
    { cat: "22. 우리의 신앙고백", ref: "시 150:1", text: "할렐루야 그의 성소에서 하나님을 찬양하며 그의 권능의 궁창에서 그를 찬양할지어다" },
    { cat: "22. 우리의 신앙고백", ref: "시 150:2", text: "그의 능하신 행동을 찬양하며 그의 지극히 위대하심을 따라 찬양할지어다" },
    { cat: "22. 우리의 신앙고백", ref: "시 150:3", text: "나팔 소리로 찬양하며 비파와 수금으로 찬양할지어다" },
    { cat: "22. 우리의 신앙고백", ref: "시 150:4", text: "소고 치며 춤 추어 찬양하며 현악과 퉁소로 찬양할지어다" },
    { cat: "22. 우리의 신앙고백", ref: "시 150:5", text: "큰 소리 나는 제금으로 찬양하며 높은 소리 나는 제금으로 찬양할지어다" },
    { cat: "22. 우리의 신앙고백", ref: "시 150:6", text: "호흡이 있는 자마다 여호와를 찬양할지어다 할렐루야" },
    { cat: "22. 우리의 신앙고백", ref: "합 3:17", text: "비록 무화과나무가 무성하지 못하며 포도나무에 열매가 없으며 감람나무에 소출이 없으며 밭에 먹을 것이 없으며 우리에 양이 없으며 외양간에 소가 없을지라도" },
    { cat: "22. 우리의 신앙고백", ref: "합 3:18", text: "나는 여호와로 말미암아 즐거워하며 나의 구원의 하나님으로 말미암아 기뻐하리로다" },
    { cat: "22. 우리의 신앙고백", ref: "합 3:19", text: "주 여호와는 나의 힘이시라 나의 발을 사슴과 같게 하사 나를 나의 높은 곳으로 다니게 하시리로다" },
    { cat: "22. 우리의 신앙고백", ref: "롬 11:36", text: "이는 만물이 주에게서 나오고 주로 말미암고 주에게로 돌아감이라 그에게 영광이 세세에 있을지어다 아멘" },
    { cat: "22. 우리의 신앙고백", ref: "계 22:20", text: "이것들을 증언하신 이가 이르시되 내가 진실로 속히 오리라 하시거늘 아멘 주 예수여 오시옵소서" },
    { cat: "22. 우리의 신앙고백", ref: "계 22:21", text: "주 예수의 은혜가 모든 자들에게 있을지어다 아멘" }
];

// 아이콘 컴포넌트
const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChevronUp = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
);

const ChevronDown = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const ChevronLeft = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRight = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const SunIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
    </svg>
);

const MoonIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

function BibleMemoryApp() {
    const [currentVerse, setCurrentVerse] = useState(RAW_DATA[0]);
    const [mode, setMode] = useState('learning');
    const [stage, setStage] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [revealIndex, setRevealIndex] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const categories = useMemo(() => {
        return [...new Set(RAW_DATA.map(item => item.cat))];
    }, []);

    useEffect(() => {
        if (categories.length > 0) {
            setExpandedCategories({ [categories[0]]: true });
        }
    }, [categories]);

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const handleSelectVerse = (verse) => {
        setCurrentVerse(verse);
        setStage(1);
        setRevealIndex(0);
        setIsSidebarOpen(false);
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleTheme = () => setIsDarkMode(!isDarkMode);
    const nextStage = () => setStage(s => Math.min(s + 1, 4));
    const prevStage = () => setStage(s => Math.max(s - 1, 1));

    const renderLearningContent = () => {
        const text = currentVerse.text;
        const chunks = chunkText(text);

        switch (stage) {
            case 1:
                return (
                    <div className="text-lg md:text-2xl leading-relaxed text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                        {text}
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-wrap gap-2 justify-center leading-loose">
                        {chunks.map((chunk, i) => (
                            <span key={i} className="bg-teal-50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 px-2 py-1 rounded-lg text-base md:text-xl font-medium border border-teal-100 dark:border-teal-800">
                                {chunk}
                            </span>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col h-full w-full">
                        <div className="flex-1 overflow-y-auto mb-4">
                            <div className="flex flex-wrap gap-2 justify-center items-center">
                                {chunks.map((chunk, i) => (
                                    <span 
                                        key={i} 
                                        className={`px-2 py-1 rounded-lg text-base md:text-xl transition-all duration-300 border ${
                                            i <= revealIndex 
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-transparent border-dashed border-gray-300 dark:border-gray-700'
                                        }`}
                                    >
                                        {chunk}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-slate-900">
                            <button 
                                onClick={() => setRevealIndex(prev => Math.min(prev + 1, chunks.length - 1))}
                                disabled={revealIndex >= chunks.length - 1}
                                className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-full font-semibold disabled:opacity-50 transition-colors text-sm"
                            >
                                다음 문장 열기
                            </button>
                            <button 
                                onClick={() => setRevealIndex(0)}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-full text-sm font-medium"
                            >
                                처음부터
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="text-center">
                        <div className="text-lg md:text-2xl leading-relaxed text-gray-800 dark:text-gray-100 font-bold p-4 md:p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30 shadow-sm mb-4">
                            {text}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">이제 눈을 감고 암송해 보세요.</p>
                    </div>
                );
            default: return null;
        }
    };

    const renderTestingContent = () => {
        const text = currentVerse.text;
        let type = 'hint';
        if (stage === 2) type = 'chosung';
        if (stage === 3) type = 'masked';
        
        if (stage === 4) {
            const allMasked = text.split('').map(c => c === ' ' ? ' ' : '*').join('');
            return (
                <div className="text-lg md:text-2xl leading-relaxed text-center font-medium tracking-wide break-all text-gray-800 dark:text-gray-200">
                    {allMasked}
                </div>
            );
        }

        const processedText = processTextForTesting(text, type);

        return (
            <div className="text-lg md:text-2xl leading-relaxed text-center font-medium text-gray-800 dark:text-gray-200" style={{wordBreak: 'keep-all'}}>
                {processedText}
            </div>
        );
    };

    // 현재 구절 번호 계산
    const currentIndex = RAW_DATA.findIndex(v => v.ref === currentVerse.ref && v.text === currentVerse.text) + 1;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 overflow-hidden">
            
            {/* Sidebar */}
            <div 
                className={`fixed inset-y-0 left-0 w-72 md:w-80 bg-white dark:bg-slate-900 shadow-xl transform transition-transform duration-300 z-50 flex flex-col border-r border-gray-200 dark:border-gray-800
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
            >
                <div className="p-3 md:p-4 bg-teal-800 dark:bg-teal-950 text-white font-bold text-base md:text-lg flex justify-between items-center shadow-sm shrink-0">
                    <span>153 성경암송</span>
                    <div className="flex items-center gap-1">
                        <button onClick={toggleTheme} className="p-2 hover:bg-teal-700 dark:hover:bg-teal-900 rounded-full transition-colors">
                            {isDarkMode ? <SunIcon /> : <MoonIcon />}
                        </button>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-teal-700 dark:hover:bg-teal-900 rounded">
                            <XIcon />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {categories.map((cat) => (
                        <div key={cat} className="border-b border-gray-100 dark:border-gray-800">
                            <button 
                                onClick={() => toggleCategory(cat)}
                                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-left font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10"
                            >
                                <span className="text-xs md:text-sm">{cat}</span>
                                {expandedCategories[cat] ? <ChevronUp /> : <ChevronDown />}
                            </button>
                            
                            {expandedCategories[cat] && (
                                <div className="bg-gray-50 dark:bg-slate-950/50">
                                    {RAW_DATA.map((item, idx) => {
                                        if (item.cat !== cat) return null;
                                        const isActive = currentVerse.ref === item.ref && currentVerse.text === item.text;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectVerse(item)}
                                                className={`w-full px-5 md:px-6 py-2.5 md:py-3 text-left text-xs md:text-sm transition-colors border-l-4 ${
                                                    isActive 
                                                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-400 border-teal-600 font-bold' 
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                            >
                                                {item.ref}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-slate-900 border-b dark:border-gray-800 p-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSidebar} className="text-teal-800 dark:text-teal-400 p-1">
                            <MenuIcon />
                        </button>
                        <button onClick={toggleTheme} className="text-teal-800 dark:text-teal-400 p-1 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            {isDarkMode ? <SunIcon /> : <MoonIcon />}
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center overflow-hidden px-2">
                        <h1 className="font-bold text-sm text-teal-900 dark:text-teal-100 truncate w-full text-center">
                            {currentVerse.ref}
                        </h1>
                        <span className="text-[10px] text-teal-700 dark:text-teal-500 font-medium">153 성경암송</span>
                    </div>
                    <div className="shrink-0">
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{currentIndex}/153</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col items-center">
                    
                    {/* Mode Tabs */}
                    <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-full flex w-full max-w-md mb-4 md:mb-6 shadow-inner shrink-0">
                        <button
                            onClick={() => { setMode('learning'); setStage(1); setRevealIndex(0); }}
                            className={`flex-1 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-200 ${
                                mode === 'learning' ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            1. 학습 과정
                        </button>
                        <button
                            onClick={() => { setMode('testing'); setStage(1); }}
                            className={`flex-1 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-200 ${
                                mode === 'testing' ? 'bg-white dark:bg-slate-700 text-indigo-800 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            2. 암송 점검
                        </button>
                    </div>

                    {/* Main Card */}
                    <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden flex-1 min-h-0">
                        {/* Card Header */}
                        <div className="bg-teal-50 dark:bg-teal-900/10 p-3 md:p-5 border-b border-gray-100 dark:border-gray-800 text-center shrink-0">
                            <div className="hidden md:block text-xs text-gray-400 dark:text-gray-500 mb-1">{currentIndex}/153</div>
                            <h2 className="text-lg md:text-2xl font-bold text-teal-800 dark:text-teal-400 mb-0.5">{currentVerse.ref}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{currentVerse.cat}</p>
                        </div>

                        {/* Card Body - 스크롤 가능 영역 */}
                        <div className="flex-1 p-4 md:p-8 flex items-center justify-center bg-white dark:bg-slate-900 overflow-y-auto min-h-0">
                            {mode === 'learning' ? renderLearningContent() : renderTestingContent()}
                        </div>

                        {/* Card Footer - 항상 하단에 고정 */}
                        <div className="p-3 md:p-4 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2 shrink-0">
                            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">
                                <span>1단계</span>
                                <span>{mode === 'learning' ? '학습' : '점검'}</span>
                                <span>4단계</span>
                            </div>
                            
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden w-full">
                                <div 
                                    className={`h-full transition-all duration-500 ease-out ${mode === 'learning' ? 'bg-teal-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${(stage / 4) * 100}%` }}
                                />
                            </div>

                            <div className="flex justify-between gap-2 mt-1">
                                <button
                                    onClick={prevStage}
                                    disabled={stage === 1}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                                >
                                    <ChevronLeft /> 이전
                                </button>
                                <button
                                    onClick={nextStage}
                                    disabled={stage === 4}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                                        mode === 'learning' ? 'bg-teal-600 dark:bg-teal-700' : 'bg-indigo-600 dark:bg-indigo-700'
                                    }`}
                                >
                                    다음 <ChevronRight />
                                </button>
                            </div>
                            <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {mode === 'learning' && stage === 1 && "전체 말씀을 소리내어 읽어보세요"}
                                {mode === 'learning' && stage === 2 && "의미 단위로 끊어서 기억하세요"}
                                {mode === 'learning' && stage === 3 && "버튼을 눌러 가려진 부분을 확인하세요"}
                                {mode === 'learning' && stage === 4 && "전체 말씀을 암송하며 정리하세요"}
                                {mode === 'testing' && stage === 1 && "첫 글자 힌트를 보고 암송하세요"}
                                {mode === 'testing' && stage === 2 && "초성만 보고 전체를 암송하세요"}
                                {mode === 'testing' && stage === 3 && "가려진 단어를 맞추어 보세요"}
                                {mode === 'testing' && stage === 4 && "완벽하게 암송했는지 확인하세요"}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BibleMemoryApp />);       </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BibleMemoryApp />);