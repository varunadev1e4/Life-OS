#!/usr/bin/env node
/**
 * Life OS — PWA Icon Generator
 * Run: node scripts/generate-icons.js
 * Requires: npm install canvas (optional, or use online tools)
 *
 * Alternatively, create icons manually:
 * - Take any 1024x1024 image
 * - Resize to 192x192 → public/icons/icon-192.png
 * - Resize to 512x512 → public/icons/icon-512.png
 *
 * Online tools:
 * - https://realfavicongenerator.net
 * - https://maskable.app (for maskable icons)
 * - https://favicon.io
 */

import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#131318')
  gradient.addColorStop(1, '#0c0c0f')
  ctx.fillStyle = gradient
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Outer ring
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = size * 0.32

  const ringGradient = ctx.createLinearGradient(
    centerX - outerRadius, centerY - outerRadius,
    centerX + outerRadius, centerY + outerRadius
  )
  ringGradient.addColorStop(0, '#7c6af7')
  ringGradient.addColorStop(1, '#38bdf8')

  ctx.strokeStyle = ringGradient
  ctx.lineWidth = size * 0.05
  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
  ctx.stroke()

  // Inner dot
  const dotGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, size * 0.12
  )
  dotGradient.addColorStop(0, '#f0f0f5')
  dotGradient.addColorStop(1, '#a8a8c0')

  ctx.fillStyle = dotGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, size * 0.12, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toBuffer('image/png')
}

try {
  const outDir = join(__dirname, '../public/icons')
  mkdirSync(outDir, { recursive: true })

  for (const size of [192, 512]) {
    const buffer = generateIcon(size)
    const file = join(outDir, `icon-${size}.png`)
    writeFileSync(file, buffer)
    console.log(`✅ Created ${file}`)
  }
  console.log('\n🎉 Icons generated successfully!')
  console.log('📁 Check: public/icons/icon-192.png and public/icons/icon-512.png')
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  canvas package not installed.')
    console.log('Run: npm install canvas')
    console.log('\nOr create icons manually using:')
    console.log('  https://realfavicongenerator.net')
    console.log('  https://maskable.app')
  } else {
    console.error(err)
  }
}
