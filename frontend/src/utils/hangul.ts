const CHOSEONG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열에서 역명의 초성(자음)을 추출하는 유틸리티 함수
 * @example
 * getChoseong("강남역") => "ㄱㄴ역"
 * getChoseong("홍대입구역") => "ㅎㄷㅇㄱ역"
 * getChoseong("서울숲") => "ㅅㅇㅅ"
 */
export function getChoseong(text: string): string {
    if (!text) return '';

    return text.split('').map((char) => {
        const code = char.charCodeAt(0);
        // 한글 음절 범위: 0xAC00(44032) ~ 0xD7A3(55203)
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const choseongIndex = Math.floor((code - 0xAC00) / 588);
            return CHOSEONG_LIST[choseongIndex] || char;
        }
        return char;
    }).join('');
}
