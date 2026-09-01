import { useEffect, useState } from "react";
import { signedImageUrl } from "../lib/storage";

// Renders an image stored in a private bucket.
//
// Takes the stored VALUE (a path like "bean-images/<uid>/<uuid>.png") rather
// than a URL, mints a short-lived signed URL for it, and renders nothing until
// that resolves. Also accepts a full http(s) URL or a local blob/data preview
// unchanged, so freshly picked files display before they are uploaded and any
// legacy row written under the old public-bucket scheme still works.
export default function StoredImage({ src, alt = "", style, className, ...rest }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!src) {
      setUrl(null);
      return undefined;
    }
    signedImageUrl(src).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  if (!url) return null;

  return <img src={url} alt={alt} style={style} className={className} {...rest} />;
}
