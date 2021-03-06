class Projectile {
	constructor(x, y, targetX, targetY, matId, damage, lifetime, otherOptions, owner) {
		this.owner = owner;

		this.x = 0;
		this.y = 0;
		this.dir = 0;
		this.targetDir = 0;

		this.radius = 8;

		this._particles = [];
		this._unusedParticles = [];
		this._particleTimer = 0;

		this._trailBitmap = ImageManager.lProjectile("Trail");

		SpriteManager.addEntity(this);
		this.init(x, y, targetX, targetY, matId, damage, lifetime, otherOptions);
	}

	makeSprite() {
		this.sprite = new PIXI.Container();

		this.particleContainer = new PIXI.Container();
		this.sprite.addChild(this.particleContainer);

		this.mainSpr = new Sprite();
		this.mainSpr.scale.set(2);
		this.mainSpr.anchor.set(0.5);
		this.sprite.addChild(this.mainSpr);

		this.refreshBitmap();
		return this.sprite;
	}

	calculateDirection() {
		return Math.atan2(this.targetY - this.y, this.targetX - this.x);
	}

	refreshDirection() {
		this.targetDir = this.calculateDirection() * (180 / Math.PI);
	}

	init(x, y, targetX, targetY, matId, damage, lifetime, otherOptions) {
		this.x = x;
		this.y = y;
		this.targetX = targetX;
		this.targetY = targetY;
		this.dir = (otherOptions.exactTarget ? this.calculateDirection() : (Math.PI * 2 * Math.random())) * (180 / Math.PI);
		this.rotateSpeed = otherOptions.rotateSpeed ?? 8.0;
		this.refreshDirection();

		this.speed = otherOptions.speed ?? 5;

		this.collided = 0;

		this.time = 0;
		this.lifetime = lifetime;
		this.directionRefreshAcc = otherOptions.directionRefreshAcc ?? 0;
		this.directionRefreshCont = otherOptions.directionRefreshCont ?? false;

		this._unusedParticles = this._unusedParticles.concat(this._particles);
		for(const p of this._unusedParticles) {
			p.visible = false;
		}
		this._particles = [];

		if(this.sprite) {
			this.sprite.visible = true;
		}
		if(this.mainSpr) {
			this.mainSpr.scale.set(2);
			this.mainSpr.alpha = 1;
		}
		if(this._materialId !== matId) {
			this._materialId = matId;
			this.refreshBitmap();
		}
		this._damage = damage;

		this.update();
	}

	refreshBitmap() {
		if(typeof this._materialId === "number") {
			const matData = MaterialTypes[this._materialId];
			if(this.mainSpr && matData) {
				//this.sprite.bitmap = ImageManager.lProjectile(matData.name);
				this.mainSpr.bitmap = ImageManager.lIcon(matData.name);
				this.mainSpr.rotation = Math.floor(Math.random() * 4) * 90;
				this.mainSpr.scale.set(2);
				this.mainSpr.alpha = 1;
			}
		} else if(typeof this._materialId === "object") {
			if(this.mainSpr) {
				this.mainSpr.bitmap = ImageManager.lIcon(this._materialId.icon);
				this.mainSpr.rotation = Math.floor(Math.random() * 4) * 90;
				this.mainSpr.scale.set(2);
				this.mainSpr.alpha = 1;
			}
		}
	}

	onPoolRemove() {
		if(this.sprite) {
			this.sprite.visible = false;
		}
	}

	onPoolClear() {
		if(this.sprite) {
			this.sprite.destroy();
			this.sprite = null;
		}
	}

	onCollide() {
		this.collided = 1;
	}

	updateCollided() {
		this.updateExistingParticles(0, 0);
		this.collided -= 0.1;
		if(this.collided < 0) {
			this.collided = 0;
		}

		this.mainSpr.scale.set(2 + (1 - this.collided.cubicOut()));
		this.mainSpr.alpha = this.collided;

		return this.collided <= 0;
	}

	update() {
		if(this.collided > 0) {
			return this.updateCollided();
		}
		return this.updateMovement();
	}

	updateMovement() {
		this.dir = RotateTowards(this.dir, this.targetDir, this.rotateSpeed);
		const rads = this.dir * (Math.PI / 180);
		const xSpd = this.speed * Math.cos(rads);
		const ySpd = this.speed * Math.sin(rads);

		CollisionManager.setProjectileCollisionCheck();

		this.x = Math.round(CollisionManager.processMovementX(this.x, this.y, xSpd));
		this.mainSpr.x = this.x;

		if(!CollisionManager.MoveSuccessful) {
			this.onCollide();
			return false;
		}

		this.y = Math.round(CollisionManager.processMovementY(this.x, this.y, ySpd));
		this.mainSpr.y = this.y;

		if(!CollisionManager.MoveSuccessful) {
			this.onCollide();
			return false;
		}

		if($gameTemp.projectileReactors) {
			for(const reactors of $gameTemp.projectileReactors) {
				if(reactors.checkProjectile(this.x, this.y)) {
					this.onCollide();
					return false;
				}
			}
		}

		if($gameTemp.enemies) {
			for(const enemy of $gameTemp.enemies) {
				if(enemy.checkProjectile(this, this.x, this.y)) {
					this.onCollide();
					return false;
				}
			}
		}

		if(this.owner !== $ppPlayer) {
			if($ppPlayer.checkProjectile(this, this.x, this.y)) {
				this.onCollide();
				return false;
			}
		}

		if(this._particleTimer++ >= 0) {
			this._particleTimer = 0;
			this.makeParticle();
		}

		this.updateExistingParticles(xSpd, ySpd);
		
		if(this.directionRefreshAcc > 0) {
			if(this.time < 15 || this.directionRefreshCont) {
				if(this.lifetime % this.directionRefreshAcc === 0) {
					this.refreshDirection();
				}
			}
		}

		this.time++;
		this.lifetime--;

		if(this.lifetime < 8) {
			this.mainSpr.alpha = this.lifetime / 8;
		}

		return this.lifetime <= 0;
	}

	makeParticle() {
		let p;
		if(this._unusedParticles.length > 0) {
			p = this._unusedParticles.pop();
			p.visible = true;
		} else {
			p = new Sprite(this._trailBitmap);
			p.scale.set(2);
			p.anchor.set(0.5);
			this.particleContainer.addChild(p);
		}
		p.move(Math.round(this.x + Math.random() *  0), Math.round(this.y + Math.random() * 0));
		p._duration = 1;
		this._particles.push(p);
	}

	updateExistingParticles(xSpd, ySpd) {
		let len = this._particles.length;
		for(let i = 0; i < len; i++) {
			const p = this._particles[i];
			p._duration -= 0.12;
			if(p._duration < 0) p._duration = 0;
			p.x += (xSpd * -0.05);
			p.y += (ySpd * -0.05);
			p.alpha = p._duration;
			p.scale.set(p._duration.cubicOut() * 2);
			if(p._duration <= 0) {
				this._unusedParticles.push(p);
				this._particles.remove(p);
				p.visible = false;
				i--;
				len--;
			}
		}
	}

	onEnemyHit(enemy) {
		enemy.takeDamage(this._damage, this.dir * (Math.PI / 180), 20);
	}
}