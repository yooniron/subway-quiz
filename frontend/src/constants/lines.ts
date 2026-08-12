export type RegionCode = 'ALL' | 'SEOUL' | 'METRO_GTX' | 'BUSAN' | 'DAEGU' | 'DAEJEON_GWANGJU';

export interface LineOption {
    id: number;
    name: string;
    color: string;
    region: 'SEOUL' | 'METRO_GTX' | 'BUSAN' | 'DAEGU' | 'DAEJEON_GWANGJU';
    regionName: string;
    shortName?: string;
}

export interface RegionTab {
    code: RegionCode;
    label: string;
    badge: string;
}

export const REGION_TABS: RegionTab[] = [
    { code: 'ALL', label: '전체 노선', badge: '전국 28개' },
    { code: 'SEOUL', label: '수도권 1~9호선', badge: '9개' },
    { code: 'METRO_GTX', label: '광역·경전철·GTX', badge: '8개' },
    { code: 'BUSAN', label: '부산·동해선', badge: '6개' },
    { code: 'DAEGU', label: '대구 도시철도', badge: '3개' },
    { code: 'DAEJEON_GWANGJU', label: '대전·광주 도시철도', badge: '2개' },
];

export const SUBWAY_LINES: LineOption[] = [
    // 1. 수도권 지하철 1~9호선 (9개)
    { id: 1, name: '1호선', color: '#0052A4', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '1호선' },
    { id: 2, name: '2호선', color: '#00A84D', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '2호선' },
    { id: 3, name: '3호선', color: '#EF7C1C', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '3호선' },
    { id: 4, name: '4호선', color: '#00A5DE', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '4호선' },
    { id: 5, name: '5호선', color: '#996CAD', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '5호선' },
    { id: 6, name: '6호선', color: '#CD7C2F', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '6호선' },
    { id: 7, name: '7호선', color: '#747F00', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '7호선' },
    { id: 8, name: '8호선', color: '#EA545D', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '8호선' },
    { id: 9, name: '9호선', color: '#BDB092', region: 'SEOUL', regionName: '수도권 1~9호선', shortName: '9호선' },

    // 2. 수도권 광역철도·경전철·GTX (8개)
    { id: 11, name: '신분당선', color: '#D4003B', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '신분당' },
    { id: 12, name: '수인분당선', color: '#FABE00', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '수인분당' },
    { id: 13, name: '경의중앙선', color: '#77C4A3', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '경의중앙' },
    { id: 14, name: '공항철도', color: '#0090D2', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '공항철도' },
    { id: 15, name: '경춘선', color: '#0C8E72', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '경춘선' },
    { id: 16, name: '우이신설선', color: '#B0CE18', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '우이신설' },
    { id: 17, name: '신림선', color: '#6789CA', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: '신림선' },
    { id: 18, name: 'GTX-A', color: '#9A6292', region: 'METRO_GTX', regionName: '광역·경전철·GTX', shortName: 'GTX-A' },

    // 3. 부산 도시철도 & 동해선 (6개)
    { id: 21, name: '부산 1호선', color: '#F06A00', region: 'BUSAN', regionName: '부산·동해선', shortName: '부산 1호선' },
    { id: 22, name: '부산 2호선', color: '#81BF48', region: 'BUSAN', regionName: '부산·동해선', shortName: '부산 2호선' },
    { id: 23, name: '부산 3호선', color: '#BB8C00', region: 'BUSAN', regionName: '부산·동해선', shortName: '부산 3호선' },
    { id: 24, name: '부산 4호선', color: '#2542B4', region: 'BUSAN', regionName: '부산·동해선', shortName: '부산 4호선' },
    { id: 25, name: '동해선', color: '#003DA5', region: 'BUSAN', regionName: '부산·동해선', shortName: '동해선' },
    { id: 26, name: '부산김해경전철', color: '#8652A1', region: 'BUSAN', regionName: '부산·동해선', shortName: '부산김해' },

    // 4. 대구 도시철도 (3개)
    { id: 31, name: '대구 1호선', color: '#D93F30', region: 'DAEGU', regionName: '대구 도시철도', shortName: '대구 1호선' },
    { id: 32, name: '대구 2호선', color: '#00AA80', region: 'DAEGU', regionName: '대구 도시철도', shortName: '대구 2호선' },
    { id: 33, name: '대구 3호선', color: '#FFB100', region: 'DAEGU', regionName: '대구 도시철도', shortName: '대구 3호선' },

    // 5. 대전 & 광주 도시철도 (2개)
    { id: 41, name: '대전 1호선', color: '#007448', region: 'DAEJEON_GWANGJU', regionName: '대전·광주 도시철도', shortName: '대전 1호선' },
    { id: 51, name: '광주 1호선', color: '#009088', region: 'DAEJEON_GWANGJU', regionName: '대전·광주 도시철도', shortName: '광주 1호선' },
];

export const getLinesByRegion = (region: RegionCode): LineOption[] => {
    if (region === 'ALL') return SUBWAY_LINES;
    return SUBWAY_LINES.filter((line) => line.region === region);
};

export const getLineById = (id: number): LineOption | undefined => {
    return SUBWAY_LINES.find((line) => line.id === id);
};
