'use client'

import { motion } from "framer-motion"
import { Share2, Linkedin, Twitter, Facebook, Mail, LucideIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ShareButtonProps {
  title: string
  description: string
  url?: string
  className?: string
}

interface SocialIcon {
  Icon: LucideIcon
  href: string
  label: string
}

export function ShareButton({ 
  title, 
  description, 
  url,
  className 
}: ShareButtonProps) {
  const [active, setActive] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(url || window.location.href)
    }
  }, [url])

  const socialIcons: SocialIcon[] = [
    { 
      Icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      label: 'LinkedIn'
    },
    { 
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
      label: 'Twitter'
    },
    { 
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      label: 'Facebook'
    },
    { 
      Icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + currentUrl)}`,
      label: 'Email'
    },
  ]

  return (
    <div className={cn("relative flex items-center justify-start", className)}>
      <div className="flex items-center gap-2">
        <motion.div
          className="relative z-10"
        >
          <motion.button
            className={cn(
              "h-10 px-4 rounded-full flex items-center gap-2",
              "bg-[#1A2B4C] hover:bg-[#1A2B4C]/90 transition-colors",
              "text-white font-medium text-sm"
            )}
            onClick={() => setActive(!active)}
            animate={{ 
              backgroundColor: active ? "#f97316" : "#1A2B4C"
            }}
          >
            <motion.div
              animate={{ rotate: active ? 45 : 0 }}
            >
              <Share2 size={18} />
            </motion.div>
            <span className="whitespace-nowrap">Share</span>
          </motion.button>
        </motion.div>
        
        {socialIcons.map(({ Icon, href, label }, index) => (
          <motion.div
            key={label}
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              "bg-[#1A2B4C] shadow-lg",
              "hover:bg-[#1A2B4C]/90 transition-all hover:-translate-y-1"
            )}
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{
              scale: active ? 1 : 0,
              opacity: active ? 1 : 0,
              x: active ? (index + 1) * 56 : 0,
              y: active ? 0 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: active ? index * 0.05 : 0
            }}
          >
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
              aria-label={label}
            >
              <Icon 
                size={18}
                className="text-white hover:text-[#ff6900] transition-colors" 
              />
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
