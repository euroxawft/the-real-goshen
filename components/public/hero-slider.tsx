'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const SLIDES = [
  {
    eyebrow: 'The new edit',
    title: 'Pieces that make an entrance.',
    text: 'Bags, shoes, and accessories chosen to turn everyday outfits into moments.',
    cta: { label: 'Shop the collection', href: '/products' },
    image: 'https://images.pexels.com/photos/15577055/pexels-photo-15577055.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    eyebrow: 'Preorder worth the wait',
    title: 'Sourced for you, crafted for you.',
    text: 'Cannot find your size, colour, or dream piece? We preorder it — usually arriving in 4 to 8 weeks.',
    cta: { label: 'How it works', href: '/about' },
    image: 'https://images.pexels.com/photos/31929486/pexels-photo-31929486/free-photo-of-elegant-white-handbag-with-gold-chain.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    eyebrow: 'Style. Confidence. You.',
    title: 'No payment online, ever.',
    text: 'Browse freely, send your picks, and we confirm payment and delivery together — personally.',
    cta: { label: 'Start your wishlist', href: '/products' },
    image: 'https://images.pexels.com/photos/2044228/pexels-photo-2044228.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-slider" aria-label="Highlights">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`hero-slide ${i === index ? 'active' : ''}`}
          aria-hidden={i !== index}
        >
          <div className="hero-slide-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt="" style={{ objectFit: 'cover', opacity: 0.3 }} />
          </div>
          <div className="container hero-slide-content">
            <span className="eyebrow eyebrow-light">{slide.eyebrow}</span>
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
            <Link href={slide.cta.href} className="button button-gold" tabIndex={i === index ? 0 : -1}>
              {slide.cta.label} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ))}

      <div className="hero-slider-dots">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => setIndex(i)}
            className={`hero-dot ${i === index ? 'active' : ''}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
