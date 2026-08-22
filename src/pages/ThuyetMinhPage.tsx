import TopicListPage from './TopicListPage';
import { ROUTES } from '@/constants';

export default function ThuyetMinhPage() {
  return (
    <TopicListPage
      title="Phim Thuyết Minh"
      slug="phim-thuyet-minh"
      canonicalPath={ROUTES.THUYET_MINH}
      description="Kho phim thuyết minh tiếng Việt chất lượng cao, xem phim thuyết minh online miễn phí tại Không Gian Phim."
    />
  );
}
