

class Map extends Sprite {
	constructor(width, height) {
		const b = new Bitmap(width, height);
		b.smooth = true;
		super(b);

		this.cursor = new Sprite(ImageManager.loadPicture("PlayerCursor"));
		this.cursor.anchor.set(0.5, 1);
		this.addChild(this.cursor);
	}

	update() {
		const globalWidth = GenerationManager.GLOBAL_WIDTH * 32;
		const globalHeight = GenerationManager.GLOBAL_HEIGHT * 32;
		const px = ($ppPlayer.position.x + globalWidth / 2) / (globalWidth);
		const py = ($ppPlayer.position.y + globalHeight / 2) / (globalHeight);
		this.cursor.move(px * this.width, py * this.height);
	}

	generate() {
		const width = this.bitmap.width;
		const height = this.bitmap.height;
		//const imgData = this.bitmap.getImageData();
		for(let x = 0; x < width; x++) {
			for(let y = 0; y < height; y++) {
				const xRatio = x / width;
				const yRatio = y / height;

				let col = 0x000000;
				let forceBlack = false;

				let alpha = 1;
				const dist = Math.sqrt(Math.pow(xRatio - 0.5, 2) + Math.pow(yRatio - 0.5, 2));
				if(dist > 0.48) {
					forceBlack = true;
					alpha = ((0.51 - dist) / 0.3).clamp(0, 1);
				}/* else if(dist > 0.47) {
					forceBlack = true;
					alpha = 1;
				}*/

				if(alpha <= 0) continue;

				if(!forceBlack) {

					const tile = GenerationManager.getTileRatio(xRatio, yRatio) >>> 0;

					const block = ((tile & 0xff000000) >> 24);
					const topTile = ((tile & 0xff0000) >> 16);
					const midTile = ((tile & 0x00ff00) >> 8);

					// if mid tile is empty...
					if(block === 99) {
						col = 0x000000;
					/*} else if(block === 0) {
						col = 0x9c805d;
						this.bitmap.fillRect(x, y - 1, 1, 1, "#9c805d");
						alpha = 0.7;
					} */
					} else if(block === 1 || block === 2) {
						col = 0x57404e;
						if(this.bitmap.getPixelNumber(x, y - 1) !== 0) {
							this.bitmap.fillRect(x, y - 1, 1, 1, "rgba(111, 227, 163, " + alpha + ")");
						}
					} else if(topTile === 220) {
						col = 0xffffff;
					} else if(midTile === 255) {
						const lowTile = (tile & 0x0000ff);
						if(lowTile === 200) {
							col = 0xe6cc8a;
						}
					} else if(Math.floor(midTile / 13) === 0) {
						col = 0x78b392;
					}

				} else {

					col = 0x000000;

				}

				const colStr = "rgba(" + ((col & 0xff0000) >> 16) + ", " + ((col & 0x00ff00) >> 8) + ", " + (col & 0x0000ff) + ", " + alpha + ")";

				/*
				imgData[setIndex + 0] = ((col & 0xff0000) >> 16) & 255;
				imgData[setIndex + 1] = ((col & 0x00ff00) >> 8) & 255;
				imgData[setIndex + 2] = (col & 0x0000ff) & 255;
				imgData[setIndex + 3] = 255;
				*/

				if(this.bitmap.getAlphaPixel(x, y) <= 0) {
					this.bitmap.fillRect(x, y, 1, 1, colStr);
				}
			}
		}

		//this.bitmap.setImageData(imgData);
	}
}