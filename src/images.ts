
export const getImage = (callback: () => void, src: string) => {
  const image = new Image();
  image.onload = callback;

  image.src = src;
  return image;
};
