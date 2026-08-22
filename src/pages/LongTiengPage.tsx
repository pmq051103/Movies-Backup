import TopicListPage from './TopicListPage';
import { ROUTES } from '@/constants';

export default function LongTiengPage() {
  return (
    <TopicListPage
      title="Lồng Tiếng Cực Mạnh"
      slug="phim-long-tieng"
      canonicalPath={ROUTES.LONG_TIENG}
      description="Kho phim lồng tiếng tiếng Việt chất lượng cao, xem phim lồng tiếng online miễn phí tại Không Gian Phim."
    />
  );
}
