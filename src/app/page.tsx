import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <section className="home__content" aria-labelledby="home-title">
        <p className="home__eyebrow">Browser-only collage tool</p>
        <h1 id="home-title">Fashion Collage Maker</h1>
        <p>
          Create an editorial outfit collage from 4 photos. Your photos stay in
          your browser.
        </p>
        <Link className="home__link" href="/fashion-collage-maker">
          Open the collage maker
        </Link>
      </section>
    </main>
  );
}
