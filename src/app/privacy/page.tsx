import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME } from "@/features/fashion-collage-maker/constants";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Privacy details for ${APP_NAME}, a browser-only collage tool that does not upload or collect user photos.`
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <section className="privacy-page__content" aria-labelledby="privacy-title">
        <p className="privacy-page__eyebrow">Privacy</p>
        <h1 id="privacy-title">Your photos stay in your browser.</h1>
        <p>
          {APP_NAME} prepares, edits, and exports your collage locally in your
          browser. Your photos are not uploaded to a server.
        </p>
        <p>
          This MVP does not collect images, image filenames, EXIF metadata,
          accounts, or saved projects. It also does not create accounts, store
          projects, or provide cloud sync.
        </p>
        <p>
          The feedback box on the result screen is local to the page. It is not
          submitted or saved.
        </p>
        <Link className="privacy-page__link" href="/">
          Back to the collage maker
        </Link>
      </section>
    </main>
  );
}
