import TopicListPage from './TopicListPage';
import { ROUTES } from '@/constants';

export default function CoTrangTQPage() {
  return (
    <TopicListPage
      title="Cổ Trang Trung Quốc"
      canonicalPath={ROUTES.CO_TRANG_TQ}
      description="Kho phim cổ trang Trung Quốc hay nhất, xem phim cổ trang Trung Quốc online miễn phí tại Không Gian Phim."
      fixedParams={{ category: 'co-trang', country: 'trung-quoc' }}
    />
  );
}
