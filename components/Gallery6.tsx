'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  readTime: number;
  category: string;
}

interface Gallery6Props {
  heading?: string;
  subtitle?: string;
  items?: GalleryItem[];
}

const insightsItems: GalleryItem[] = [
  {
    id: "item-1",
    title: "Understanding IEC 61511: What Plant Managers in South Africa Need to Know",
    summary: "IEC 61511 defines the requirements for safety instrumented systems in the process industry. For plant managers in South Africa, understanding what the standard requires is no longer optional.",
    url: "/insights/iec-61511-plant-managers",
    image: "/IEC.jpeg",
    readTime: 12,
    category: "Industry Standards"
  },
  {
    id: "item-2",
    title: "A Guide to Hazardous Area Classification in Southern Africa",
    summary: "Hazardous area classification determines where explosive atmospheres may exist in your facility and what equipment protection levels are required. This guide covers the classification process and applicable standards.",
    url: "/insights/hazardous-area-classification-southern-africa",
    image: "/HAC.jpg",
    readTime: 8,
    category: "Hazardous Areas"
  },
  {
    id: "item-3",
    title: "Top 5 Reasons for False Alarms in Optical Flame Detectors",
    summary: "False alarms in optical flame detection systems are one of the most disruptive and costly problems in industrial fire protection. This article identifies the five most common causes.",
    url: "/insights/flame-detector-false-alarms",
    image: "/optical-flame-detector.jpeg",
    readTime: 6,
    category: "Fire & Gas"
  },
  {
    id: "item-4",
    title: "The Difference Between a SIL Assessment and a HAZOP",
    summary: "These two studies come up together constantly in process safety conversations, and they often get conflated. Here's the distinction in plain terms.",
    url: "/insights/sil-assessment-vs-hazop",
    image: "/SIL-HAZOP.jpeg",
    readTime: 7,
    category: "Functional Safety"
  },
  {
    id: "item-5",
    title: "What to Expect During a Fire and Gas System Commissioning",
    summary: "Proper F&G commissioning is a structured, documented process that proves the entire system — from field sensors through to logic, alarms, and physical outputs — works as designed.",
    url: "/insights/fire-and-gas-system-commissioning",
    image: "/f&g.jpeg",
    readTime: 8,
    category: "Fire & Gas"
  },
];

const Gallery6 = ({
  heading = "Industry Insights",
  subtitle = "",
  items = insightsItems,
}: Gallery6Props) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-24 bg-white overflow-hidden relative">
      {/* Grid Background with Fade */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(#1A2B4C 1px, transparent 1px), linear-gradient(90deg, #1A2B4C 1px, transparent 1px)', 
          backgroundSize: '50px 50px',
          opacity: 0.03,
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
        }}
      ></div>
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 text-center max-w-[800px] mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-2 h-2 bg-orange-500"></div>
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">
              Knowledge Hub
            </span>
            <div className="w-2 h-2 bg-orange-500"></div>
          </div>
          <h2 className="text-[#1A2B4C] text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-normal leading-none">
            {heading}
          </h2>
          {subtitle && (
            <p className="text-slate-500 text-lg leading-relaxed font-medium text-center mt-4">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="w-full py-8 px-4 md:px-12 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 max-w-[1200px]">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "center",
              slidesToScroll: 1,
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="py-10">
              {items.map((item) => (
                <CarouselItem key={item.id} className="md:basis-1/3 px-4">
                  <Link
                    href={item.url}
                    className="group flex flex-col justify-between h-full bg-white rounded-xl overflow-visible shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 block relative z-10"
                  >
                    <div className="relative">
                      <div className="flex aspect-[3/2] overflow-hidden">
                        <div className="flex-1 relative">
                          <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      </div>
                      <span className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="text-slate-400 text-xs font-medium mb-3">
                        {item.readTime} min read
                      </div>
                      <div className="text-[#1A2B4C] text-lg font-black uppercase tracking-normal leading-tight mb-4 line-clamp-2">
                        {item.title}
                      </div>
                      <hr className="border-t border-[#EEEEEE] mb-4" />
                      <div className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                        {item.summary}
                      </div>
                      <div className="mt-auto flex items-center text-[#1A2B4C] font-black text-xs uppercase tracking-[0.2em] group/btn transition-colors duration-300 group-hover:text-orange-500">
                        Explore Insight
                        <ArrowUpRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-8">
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              carouselApi?.scrollPrev();
            }}
            className="border-[#1A2B4C] text-[#1A2B4C] hover:bg-[#1A2B4C] hover:text-white order-2 sm:order-1"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Link href="/insights">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest px-8 py-3 shadow-lg shadow-orange-500/20"
            >
              View All Insights
            </Button>
          </Link>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              carouselApi?.scrollNext();
            }}
            className="border-[#1A2B4C] text-[#1A2B4C] hover:bg-[#1A2B4C] hover:text-white order-3 sm:order-2"
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export { Gallery6 };
