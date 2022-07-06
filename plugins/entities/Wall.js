
class Wall {
	constructor(url) {
		this.init(url);
		this.x = 0;
		this.y = 0;
		this.hitBox = null;
		SpriteManager.addEntity(this);
	}

	init(url) {
		this._textureUrl = url;
		if(this.baseSprite) {
			this.baseSprite.visible = true;
			this.baseSprite.bitmap = ImageManager.lTile(this._textureUrl);
		}
	}

	destroy() {
		this.baseSprite.visible = false;
	}

	setup(globalX, globalY, hitBox) {
		this.x = globalX;
		this.y = globalY;
		this.hitBox = hitBox ?? [0, 0, 0, 0];
		this.baseSprite.move(globalX, globalY + 32);
	}

	makeSprite() {
		if(this.baseSprite) return this.baseSprite;

		this.baseSprite = new Sprite();
		this.baseSprite.scale.set(2);
		this.baseSprite.anchor.set(0.5, 1);
		this.baseSprite.visible = true;
		this.baseSprite.bitmap = ImageManager.lTile(this._textureUrl);
		return this.baseSprite;
	}

	update() {
		if(
			(TouchInput.worldX > (this.x - (32 * this.hitBox[0]))) &&
			(TouchInput.worldX < (this.x + (32 * this.hitBox[1]))) &&
			(TouchInput.worldY > (this.y - (32 * this.hitBox[2]))) &&
			(TouchInput.worldY < (this.y + (32 * this.hitBox[3])))
		) {
			PP.selectedObjects.push(this);
		}
	}

	setSelected(s) {
		this.baseSprite.tint = s ? 0xdddddd : 0xffffff;
	}
}
