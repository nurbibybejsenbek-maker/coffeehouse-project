"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'

// Галерея фото кофейни
const galleryImages = [
  { 
    id: 1, 
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', 
    alt: 'Кофейня интерьеры' 
  },
  { 
    id: 2, 
    src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', 
    alt: 'Кофе дайындау' 
  },
  { 
    id: 3, 
    src: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', 
    alt: 'Латте өнері' 
  },
  { 
    id: 4, 
    src: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80', 
    alt: 'Десерттер' 
  },
  { 
    id: 5, 
    src: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80', 
    alt: 'Кофе бұршақтары' 
  },
  { 
    id: 6, 
    src: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80', 
    alt: 'Бариста жұмысы' 
  },
  { 
    id: 7, 
    src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80', 
    alt: 'Кофе машинасы' 
  },
  { 
    id: 8, 
    src: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&q=80', 
    alt: 'Эспрессо' 
  },
  { 
    id: 9, 
    src: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80', 
    alt: 'Латте' 
  },
  { 
    id: 10, 
    src: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=800&q=80', 
    alt: 'Жылы атмосфера' 
  },
  { 
    id: 11, 
    src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', 
    alt: 'Кофе дайындау процесі' 
  },
  { 
    id: 12, 
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', 
    alt: 'Кофейня атмосферасы' 
  },
]

export default function GalleryPage() {
  const t = useTranslations('common')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  return (
    <div className="container py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('gallery')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryImages.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
            onClick={() => setSelectedImage(image.id)}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>

      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="relative aspect-video w-full">
              <Image
                src={galleryImages.find((img) => img.id === selectedImage)?.src || ''}
                alt={galleryImages.find((img) => img.id === selectedImage)?.alt || ''}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

