import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Copy, Check } from 'lucide-react'

const DroneQRCode = ({ droneId, registrationNumber }) => {
  const [copied, setCopied] = useState(false)

  const verificationUrl = `${window.location.origin}/verify?drone=${registrationNumber}`
  const qrValue = verificationUrl

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${droneId}`)
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 400
    canvas.height = 400
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    img.onload = () => {
      ctx.drawImage(img, 40, 40, 320, 320)
      
      ctx.fillStyle = '#1a2332'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(registrationNumber, canvas.width / 2, 380)
      
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.fillText('Scannez pour vérifier l\'autorisation', canvas.width / 2, 395)
      
      const link = document.createElement('a')
      link.download = `qr-${registrationNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white p-4 rounded-xl inline-block">
      <div className="flex flex-col items-center">
        {/* QR Code */}
        <QRCodeSVG
          id={`qr-${droneId}`}
          value={qrValue}
          size={200}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#1a2332"
        />
        
        {/* Numéro d'immatriculation */}
        <p className="mt-2 text-sm font-mono text-[#1a2332] font-semibold">
          {registrationNumber}
        </p>
        
        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-[#4f8ef7] text-white rounded-lg text-sm hover:bg-[#3b7de0] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#1a2332] text-[#e2e8f0] rounded-lg text-sm hover:bg-[#1f2937] transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copier le lien
              </>
            )}
          </button>
        </div>
        
        {/* Lien de vérification */}
        <p className="mt-2 text-xs text-[#64748b] break-all max-w-[200px] text-center">
          {qrValue}
        </p>
      </div>
    </div>
  )
}

export default DroneQRCode