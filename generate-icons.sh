#!/bin/bash

# Simple PWA icon generator for AllCattle
# This creates placeholder icons with text for development

echo "🐄 Generating AllCattle PWA Icons..."

cd public/icons

# Create placeholder icons with different sizes
for size in 72 96 128 144 152 180 192 384 512; do
    echo "Creating ${size}x${size} icon..."
    # Create a simple colored square with text using ImageMagick (if available)
    # Otherwise create placeholder files
    if command -v convert &> /dev/null; then
        convert -size ${size}x${size} xc:'#3b82f6' \
                -font Arial -pointsize $((size/8)) -fill white \
                -gravity center -annotate +0+0 "🐄\nAllCattle" \
                icon-${size}x${size}.png
    else
        # Create a simple text file as placeholder
        echo "AllCattle ${size}x${size} icon placeholder" > icon-${size}x${size}.png
    fi
done

# Create additional sizes for completeness
if command -v convert &> /dev/null; then
    convert -size 32x32 xc:'#3b82f6' \
            -font Arial -pointsize 4 -fill white \
            -gravity center -annotate +0+0 "🐄" \
            icon-32x32.png
fi

echo "✅ PWA icons generated successfully!"
echo "Note: For production, replace these with professionally designed icons."
