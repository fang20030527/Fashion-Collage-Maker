import type { Metadata } from "next";

import { FashionCollageMaker } from "./FashionCollageMaker";

export const metadata: Metadata = {
  title: "Fashion Collage Maker",
  description: "Create an editorial outfit collage from 4 photos."
};

export default function FashionCollageMakerPage() {
  return <FashionCollageMaker />;
}
