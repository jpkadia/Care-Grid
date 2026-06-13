import React, { useEffect, useRef, useState } from 'react';

const GallerySlider = ({ images, borderClass = 'border-white/10' }) => {
  const trackRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-gallery-card]');
    const distance = (card?.getBoundingClientRect().width || 320) + 16;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    const atStart = track.scrollLeft <= 8;
    if (direction > 0 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
    else if (direction < 0 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
    else track.scrollBy({ left: distance * direction, behavior: 'smooth' });
  };

  useEffect(() => {
    if (paused || images.length < 2) return undefined;
    const timer = setInterval(() => move(1), 4000);
    return () => clearInterval(timer);
  }, [images.length, paused]);

  return (
    <div className="relative group" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div ref={trackRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 gallery-scroll">
        {images.map((image, index) => (
          <div data-gallery-card key={`${image}-${index}`} className={`relative flex-none w-[84%] sm:w-[58%] lg:w-[42%] aspect-[4/3] snap-center rounded-[28px] overflow-hidden border ${borderClass} shadow-xl`}>
            <img src={image} alt={`Clinic gallery ${index + 1}`} draggable="false" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            <span className="absolute bottom-4 right-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-3 py-2 rounded-full">{index + 1} / {images.length}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/45 backdrop-blur text-white rounded-full shadow-lg"><i className="fas fa-chevron-left"></i></button>
      <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/45 backdrop-blur text-white rounded-full shadow-lg"><i className="fas fa-chevron-right"></i></button>
    </div>
  );
};

export default GallerySlider;
