<?php

namespace App\Services;

use App\Models\Setting;

class WhatsAppService
{
    public function getWaNumber(): string
    {
        return Setting::where('key', 'store_whatsapp')->value('value') ?? '6281234567890';
    }

    public function getStoreName(): string
    {
        return Setting::where('key', 'store_name')->value('value') ?? 'Toko Online';
    }

    public function generateProductInquiryMessage(string $productName, float $price, ?string $url = null): string
    {
        $storeName = $this->getStoreName();
        $message = "Halo Admin *{$storeName}*, saya ingin menanyakan produk:\n\n";
        $message .= "📦 *{$productName}*\n";
        $message .= "💵 Harga: Rp " . number_format($price, 0, ',', '.') . "\n";
        if ($url) {
            $message .= "🔗 Link: {$url}\n";
        }
        $message .= "\nApakah masih tersedia?";

        return $message;
    }

    public function generateOrderMessage(array $items, float $total, array $customerData): string
    {
        $storeName = $this->getStoreName();
        $message = "Halo Admin *{$storeName}*, saya ingin memesan:\n\n";
        $message .= "📋 *DAFTAR PESANAN:*\n";

        foreach ($items as $item) {
            $message .= "- {$item['product_name']} x {$item['quantity']} = Rp " . number_format($item['subtotal'], 0, ',', '.') . "\n";
        }

        $message .= "\n💰 *Total: Rp " . number_format($total, 0, ',', '.') . "*\n";
        $message .= "\n📝 *Data Pemesan:*\n";
        $message .= "Nama: {$customerData['customer_name']}\n";
        $message .= "Telp: {$customerData['customer_phone']}\n";
        if (!empty($customerData['customer_email'])) {
            $message .= "Email: {$customerData['customer_email']}\n";
        }
        if (!empty($customerData['shipping_address'])) {
            $message .= "Alamat: {$customerData['shipping_address']}\n";
        }
        if (!empty($customerData['notes'])) {
            $message .= "Catatan: {$customerData['notes']}\n";
        }

        $message .= "\nMohon konfirmasi ketersediaan dan total pembayaran. Terima kasih!";

        return $message;
    }

    public function generateWaLink(string $message): string
    {
        $number = $this->getWaNumber();
        return 'https://wa.me/' . $number . '?text=' . urlencode($message);
    }
}
