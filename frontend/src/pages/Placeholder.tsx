type Props = { title: string; owner: string };

// Trang cho cho tung thanh vien dien theo 04_Phan_cong_cong_viec.
export default function Placeholder({ title, owner }: Props) {
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>{title}</h1>
      <p>
        <small>{`TODO(${owner}): xay dung man hinh theo dac ta.`}</small>
      </p>
      <a href="/">Ve trang chu</a>
    </main>
  );
}
