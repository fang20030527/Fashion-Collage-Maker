import type { Metadata } from "next";

import { FashionCollageMaker } from "./fashion-collage-maker/FashionCollageMaker";

export const metadata: Metadata = {
  title: {
    absolute: "Fashion Collage Maker | Browser Photo Collage Tool"
  },
  description:
    "Create a magazine-ready fashion collage from 1 to 6 photos locally in your browser. Photos are not uploaded.",
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return <FashionCollageMaker />;
}
