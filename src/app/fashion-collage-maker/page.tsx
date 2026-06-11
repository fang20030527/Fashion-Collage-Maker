import type { Metadata } from "next";

import { FashionCollageMaker } from "./FashionCollageMaker";

export const metadata: Metadata = {
  title: {
    absolute: "Fashion Collage Maker | Browser Photo Collage Tool"
  },
  description:
    "Create an editorial outfit collage from 4 photos locally in your browser. Photos are not uploaded.",
  alternates: {
    canonical: "/fashion-collage-maker"
  }
};

export default function FashionCollageMakerPage() {
  return <FashionCollageMaker />;
}
