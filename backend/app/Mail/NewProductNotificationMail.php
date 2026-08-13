<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Product;
use App\Models\StoreSubscriber;

class NewProductNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $product;
    public $subscriber;
    public $unsubscribeUrl;

    public function __construct(Product $product, StoreSubscriber $subscriber)
    {
        $this->product = $product;
        $this->subscriber = $subscriber;
        $this->unsubscribeUrl = url('/unsubscribe?email=' . urlencode($subscriber->email) . '&token=' . $subscriber->token);
    }

    public function build()
    {
        $storeName = config('app.name', 'Toko Online');

        return $this->subject("Produk Baru di {$storeName}")
            ->view('emails.new-product-notification')
            ->with([
                'product' => $this->product,
                'storeName' => $storeName,
                'unsubscribeUrl' => $this->unsubscribeUrl,
            ]);
    }
}
