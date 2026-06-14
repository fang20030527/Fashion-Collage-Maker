import type { Metadata } from "next";

import { APP_NAME } from "@/features/fashion-collage-maker/constants";
import { FashionCollageMaker } from "./fashion-collage-maker/FashionCollageMaker";

export const metadata: Metadata = {
  title: {
    absolute: `${APP_NAME} | Browser Photo Collage Tool`
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
