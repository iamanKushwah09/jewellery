'use client';

import Header from '../../components/Header';

import { 
  HeartIcon, 
  SparklesIcon, 
  GlobeAltIcon,
  UsersIcon,
  TrophyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState, useRef } from 'react';

const useInView = (options = { threshold: 0.1 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options.threshold]);

  return [ref, isVisible] as const;
};

const AnimatedCounter = ({ target, suffix = '', prefix = '' }: { target: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useInView();

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const duration = 2000;
      const increment = target / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [target, isVisible]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-gray-900" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
      {prefix}{count}{suffix}
    </span>
  );
};

const SlideIn = ({ children, direction = 'up', delay = 0 }: { children: React.ReactNode, direction?: 'up' | 'down' | 'left' | 'right', delay?: number }) => {
  const [ref, isVisible] = useInView();
  
  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(50px)';
      case 'down': return 'translateY(-50px)';
      case 'left': return 'translateX(-50px)';
      case 'right': return 'translateX(50px)';
      default: return 'translateY(50px)';
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 transform-none' : 'opacity-0'
      }`}
      style={{
        transform: isVisible ? 'none' : getTransform(),
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export default function AboutPage() {
  const coreValues = [
    {
      icon: SparklesIcon,
      title: 'Artistry',
      description: 'Our master artisans blend age-old techniques with contemporary visions to craft wearable art.'
    },
    {
      icon: HeartIcon,
      title: 'Passion',
      description: 'We pour our hearts into every sketch, every cut, and every setting to ensure perfection.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Ethical Sourcing',
      description: 'All our diamonds and precious metals are strictly conflict-free and responsibly sourced.'
    },
    {
      icon: UsersIcon,
      title: 'Legacy',
      description: 'We create heirloom pieces that transcend generations, preserving your most precious memories.'
    },
    {
      icon: TrophyIcon,
      title: 'Excellence',
      description: 'Rigorous quality control and BIS hallmarking guarantee the utmost purity and brilliance.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Trust',
      description: 'Our transparent pricing and lifetime exchange policies mean you can shop with absolute confidence.'
    }
  ];

  const stats = [
    { target: 120, suffix: 'K+', label: 'Delighted Clients' },
    { target: 30, suffix: '+', label: 'Years of Heritage' },
    { target: 8500, suffix: '+', label: 'Bespoke Designs' },
    { target: 15, suffix: '', label: 'Global Boutiques' }
  ];

  const teamMembers = [
    {
      name: 'Alexander Pierce',
      role: 'Founder & Master Jeweler',
      quote: 'Vellora Jewels was born from a singular vision: to democratize luxury without compromising the timeless art of fine jewellery making.',
      bio: 'Alexander brings over 35 years of expertise in haute joaillerie. Trained in the historic diamond districts of Antwerp and Paris, his visionary leadership has established Vellora Jewels as an international standard-bearer for flawless craftsmanship and breathtaking design.',
      image: '/founder.jpeg',
      accentColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      notchColor: 'border-amber-600',
      imageLeft: false
    },
    {
      name: 'Sophia Laurent',
      role: 'Creative Director',
      quote: 'A piece of jewellery should be a poem you can wear. We design not just for the eyes, but for the soul of the wearer.',
      bio: 'Sophia\'s background in fine arts and architectural design brings a unique, structural elegance to Vellora\'s collections. She leads our global design studio, constantly pushing the boundaries of traditional motifs to create modern heirlooms.',
      image: '/co-founder.jpeg',
      accentColor: 'text-amber-600',
      borderColor: 'border-yellow-200',
      notchColor: 'border-amber-500',
      imageLeft: true
    },
    {
      name: 'Julian Rossi',
      role: 'Head of Gemology',
      quote: 'The journey of a diamond from the earth to your finger is a miracle. We ensure only the top 1% of gems ever make it to a Vellora setting.',
      bio: 'Julian is a GIA-certified gemologist with a meticulous eye for brilliance, fire, and scintillation. He personally oversees our global sourcing network, ensuring every stone meets our uncompromising ethical and quality standards.',
      image: '/GM.jpeg',
      accentColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      notchColor: 'border-yellow-600',
      imageLeft: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      <Header />
      
      {/* Hero Section */}
      <section className="relative text-white py-24 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <img
          src="/about-bg.jpg"
          alt="Vellora Jewels Background"
          className="absolute inset-0 z-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(135deg, rgba(26,18,9,0.85) 0%, rgba(107,26,26,0.7) 100%)' }} />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #C9920A)' }} />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase" style={{ color: '#C9920A' }}>Our Heritage</span>
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #C9920A, transparent)' }} />
            </div>
            <h1
              className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic' }}
            >
              The House of Vellora
            </h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow-md" style={{ color: '#F5E6C8' }}>
              Redefining luxury through unparalleled craftsmanship, ethical sourcing, and timeless elegance.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <SlideIn direction="left">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>A Legacy Forged in Gold</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Founded in 1995 within a small atelier in New York, Vellora Jewels began with a simple yet powerful vision: to bring the finest handcrafted gold and diamond jewellery to discerning clients worldwide. What started as a bespoke studio has blossomed into an internationally celebrated luxury brand.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  We believe that jewellery is more than mere adornment. It is emotion made tangible. It is the whisper of a promise, the celebration of a milestone, and the physical embodiment of a family's legacy. Every ring, necklace, and bracelet we create is crafted with absolute precision to become a cherished heirloom.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Today, we continue to innovate our designs while remaining steadfastly anchored to our core values of purity, masterful craftsmanship, and unwavering ethical standards.
                </p>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="relative rounded-2xl h-[500px] flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-yellow-900/10 group">
                <div className="absolute inset-0 bg-[#C9920A] opacity-20 group-hover:opacity-10 transition-opacity duration-500 z-10" />
                <img 
                  src="/story-image.jpg"
                  alt="Crafting Vellora Jewellery"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="absolute inset-0 bg-gradient-to-br from-yellow-100 to-amber-50 flex flex-col items-center justify-center p-8 text-center border border-amber-200"><svg class="w-16 h-16 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg><h3 class="text-2xl font-serif text-amber-900 mb-2">Masterful Craftsmanship</h3><p class="text-amber-700/80">Every piece is hand-finished by master artisans.</p></div>';
                  }}
                />
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#6B1A1A]" />
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <SlideIn key={index} direction="up" delay={index * 100}>
                <div className="p-6">
                  <div className="flex justify-center mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-[#E8B84B]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                    </span>
                  </div>
                  <div className="text-sm md:text-base font-medium text-[#F5E6C8] uppercase tracking-wider mt-2">
                    {stat.label}
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 lg:py-32 bg-[#FFFDF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>The Vellora Standard</h2>
            <p className="text-lg text-gray-600">
              Our principles are as enduring as the diamonds we set. These core values guide every sketch, every cut, and every interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <SlideIn key={index} direction="up" delay={index * 100}>
                <div className="bg-white rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-yellow-900/5 hover:border-[#C9920A]/30 hover:shadow-[0_8px_30px_rgba(201,146,10,0.1)] transition-all duration-300 h-full group">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: 'rgba(201,146,10,0.1)' }}>
                    <value.icon className="h-7 w-7" style={{ color: '#C9920A' }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Our Visionaries</h2>
            <p className="text-lg text-gray-600">
              Meet the masterminds behind Vellora Jewels. A team united by a singular obsession for perfection.
            </p>
          </div>

          <div className="space-y-24">
            {teamMembers.map((member, index) => (
              <SlideIn key={index} direction={member.imageLeft ? 'right' : 'left'}>
                <div className="flex flex-col bg-white border border-[#C9920A]/20 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-6">
                    <svg className="h-10 w-10 text-[#C9920A]/20" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                    <p className="text-xl md:text-2xl text-gray-900 leading-relaxed italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      "{member.quote}"
                    </p>
                    <div className="h-px w-24 bg-[#C9920A]/30"></div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{member.name}</p>
                      <p className={`font-medium ${member.accentColor} mb-4`}>{member.role}</p>
                      <p className="text-lg text-gray-600 leading-relaxed">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
} 