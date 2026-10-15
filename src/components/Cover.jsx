// An article's image, or a generated paper-and-light composition when it has none.
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function Cover({ article, eager = false }) {
  if (article.image_url) {
    return <img src={article.image_url} alt={article.title} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  }
  const h = hash(article.id || article.title);
  const angle = h % 180;
  const x = 20 + (h % 60);
  return (
    <div
      className="cover-gen"
      role="img"
      aria-label={article.title}
      style={{
        background: `radial-gradient(circle at ${x}% 38%, rgba(200,105,63,.22), transparent 42%),
          linear-gradient(${angle}deg, #efe9e0, #d9d2c6 60%, #c9c1b3)`,
      }}
    >
      <span className="cover-gen__arch" />
    </div>
  );
}
