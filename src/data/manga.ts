export type Chapter = { number: number; title?: string; locked?: boolean };
export type Manga = {
  slug: string; title: string; author: string; status: string;
  description: string; genres: string[]; chapters: Chapter[];
};

export const mangaList: Manga[] = [
  {
    slug: 'alpha-trauma', title: 'Alpha Trauma', author: 'Demo Author', status: 'Đang tiến hành',
    description: 'Dữ liệu mẫu để kiểm tra giao diện. Sau này phần này sẽ lấy từ Supabase.',
    genres: ['Drama', 'Romance', 'BL'],
    chapters: [{ number: 43 }, { number: 42 }, { number: 41, locked: true }, { number: 40, locked: true }, { number: 39 }],
  },
  {
    slug: 'moonlight-note', title: 'Moonlight Note', author: 'Demo Studio', status: 'Hoàn thành',
    description: 'Một bộ truyện mẫu khác để kiểm tra danh sách truyện và responsive.',
    genres: ['Slice of Life', 'Romance'],
    chapters: [{ number: 12 }, { number: 11 }, { number: 10, locked: true }],
  },
];
export function findManga(slug: string) { return mangaList.find((item) => item.slug === slug); }
