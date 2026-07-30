import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://iqzycldodpiutsndfzhq.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_P7iEFxAw2-38dARmK3-gIA_2Z8NIzet';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 비보안 컨텍스트(HTTP 외부 IP)에서도 동작하는 UUID Fallback 생성 함수
export function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (_e) {
            // fallback으로 진행
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
