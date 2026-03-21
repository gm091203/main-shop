import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { dummyProducts } from './Home';

const CHO_HANGUL = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const getChosung = (str) => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) {
      result += CHO_HANGUL[Math.floor(code / 588)];
    } else {
      result += str.charAt(i);
    }
  }
  return result;
};

const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const results = dummyProducts.filter(p => {
        if (!query.trim()) return true; // Empty query shows all or none? Let's show none since we say "검색 결과"
        
        const searchChosung = getChosung(query.replace(/\s+/g, '').toLowerCase());
        const searchNormal = query.replace(/\s+/g, '').toLowerCase();
        const targetChosung = getChosung(p.name.replace(/\s+/g, '').toLowerCase());
        const targetNormal = p.name.replace(/\s+/g, '').toLowerCase();
        
        return targetChosung.includes(searchChosung) || targetNormal.includes(searchNormal);
    });

    return (
        <div className="container animate-fade-in" style={{ padding: '60px 20px', minHeight: '60vh' }}>
            <h2 className="section-title">
                '{query}' 검색 결과 ({query.trim() === '' ? 0 : results.length}건)
            </h2>
            
            {query.trim() !== '' && results.length > 0 ? (
                <div className="products-grid">
                    {results.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.2rem' }}>검색 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default Search;
