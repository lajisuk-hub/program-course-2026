// 캡처 사진을 적당한 크기로 줄여 글자만 읽기 좋게 만든다
export function fileToSmallBase64(file, maxSide = 1500) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 열지 못했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('사진을 열지 못했습니다.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const url = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ data: url.split(',')[1], mime: 'image/jpeg' });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
