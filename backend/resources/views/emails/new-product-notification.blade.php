<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Produk Baru di {{ $storeName }}</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f7f7f8; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e8e8; }
        .header { background: #111; color: #fff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
        .body { padding: 24px; }
        .product-image { width: 100%; border-radius: 12px; overflow: hidden; background: #f1f1f2; }
        .product-image img { width: 100%; height: auto; display: block; }
        .product-name { font-size: 18px; font-weight: 700; margin: 16px 0 8px; color: #111; }
        .product-price { font-size: 20px; font-weight: 800; color: #111; margin-bottom: 8px; }
        .product-description { color: #777; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
        .button { display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 9px; font-weight: 600; font-size: 14px; }
        .button:hover { background: #333; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        .footer a { color: #666; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h1>Produk Baru di {{ $storeName }}</h1>
            </div>
            <div class="body">
                @php
                    $image = $product->images && count($product->images) > 0 ? $product->images[0] : null;
                    $price = $product->discount_price ?? $product->price;
                @endphp

                @if($image)
                <div class="product-image">
                    <img src="{{ $image }}" alt="{{ $product->name }}">
                </div>
                @endif

                <div class="product-name">{{ $product->name }}</div>

                <div class="product-price">
                    Rp {{ number_format($price, 0, ',', '.') }}
                    @if($product->discount_price)
                        <span style="text-decoration: line-through; color: #999; font-size: 14px; font-weight: 400; margin-left: 8px;">
                            Rp {{ number_format($product->price, 0, ',', '.') }}
                        </span>
                    @endif
                </div>

                @if($product->description)
                <div class="product-description">
                    {{ \Illuminate\Support\Str::limit(strip_tags($product->description), 150) }}
                </div>
                @endif

                <a href="{{ url('/produk/' . $product->slug) }}" class="button">Lihat Produk</a>
            </div>
        </div>

        <div class="footer">
            <p>Anda menerima email ini karena mengikuti toko kami.</p>
            <p>
                <a href="{{ $unsubscribeUrl }}">Berhenti mengikuti</a>
            </p>
        </div>
    </div>
</body>
</html>
