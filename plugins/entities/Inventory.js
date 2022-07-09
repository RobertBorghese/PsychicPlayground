class Inventory {
	static MaxPassiveSkills = 8;
	static MaxActiveSkills = 8;
	static MaxMaterials = 8;
	static MaxItems = 9;

	static HotBarItems = 9;

	static SkipEmptyHotBarSlots = false;

	constructor() {
		this.passiveSkills = new Int32Array(Inventory.MaxPassiveSkills);
		this.activeSkills = new Int32Array(Inventory.MaxActiveSkills);
		this.materials = new Int32Array(Inventory.MaxMaterials);
		this.items = new Int32Array(Inventory.MaxItems);

		this.passiveSkills.fill(-1);
		this.activeSkills.fill(-1);
		this.materials.fill(-1);
		this.items.fill(-1);

		this.activeSkillAmmo = new Int32Array(AbilityTypes.length);

		this.addActiveSkill(0);
		this.addActiveSkill(3);

		this.addMaterial(0, 10);
		this.addMaterial(3, 256);

		this.addItem(0);

		this.hotbarIndex = 0;
		this.hotbar = new Int32Array(Inventory.HotBarItems);
		for(let i = 0; i < this.hotbar.length; i++) this.hotbar[i] = -1;

		this.hotbar[0] = 0;
		this.hotbar[2] = 3;
		this.hotbar[3] = 0;
		this.hotbar[4] = 1;
		this.hotbar[5] = 2;
		this.hotbar[6] = 0;

		this.verifyHotbarOptions();
	}

	verifyHotbarOptions() {
		for(let i = 0; i <= 2; i++) {
			const skillId = this.hotbar[i];
			if(!this.hasActiveSkill(skillId)) {
				this.hotbar[i] = -1;
			}
		}
		for(let i = 3; i <= 6; i++) {
			const materialId = this.hotbar[i];
			if(!this.hasMaterial(materialId)) {
				this.hotbar[i] = -1;
			}
		}
		for(let i = 7; i <= 9; i++) {
			const itemId = this.hotbar[i];
			if(!this.hasItem(itemId)) {
				this.hotbar[i] = -1;
			}
		}
	}

	save() {
		return [
			Array.from(this.passiveSkills),
			Array.from(this.activeSkills),
			Array.from(this.materials),
			Array.from(this.items)
		];
	}

	load(data) {
		this.passiveSkills = TypedArray.from(data[0]);
		this.activeSkills = TypedArray.from(data[1]);
		this.materials = TypedArray.from(data[2]);
		this.items = TypedArray.from(data[3]);
	}

	update() {
		this.updateHotbarInput();
	}

	updateHotbarInput() {
		if(TouchInput.wheelScrolled > 0) {
			this.incrementHotbarIndex();
		} else if(TouchInput.wheelScrolled < 0) {
			this.decrementHotbarIndex();
		} else {
			for(let i = 1; i <= 9; i++) {
				if(Input.isTriggeredEx("" + i)) {
					this.hotbarIndex = i - 1;
					break;
				}
			}
		}
	}

	incrementHotbarIndex() {
		if(Inventory.SkipEmptyHotBarSlots) {
			let next = -1;
			for(let i = this.hotbarIndex + 1; i < Inventory.HotBarItems; i++) {
				if(this.hotbar[i] !== -1) {
					next = i;
					break;
				}
			}
			if(next === -1) {
				for(let i = 0; i < this.hotbarIndex; i++) {
					if(this.hotbar[i] !== -1) {
						next = i;
						break;
					}
				}
			}
			if(next !== -1) {
				this.hotbarIndex = next;
			}
		} else {
			this.hotbarIndex++;
			if(this.hotbarIndex >= Inventory.HotBarItems) {
				this.hotbarIndex = 0;
			}
		}
	}

	decrementHotbarIndex() {
		if(Inventory.SkipEmptyHotBarSlots) {
			let next = -1;
			for(let i = this.hotbarIndex - 1; i >= 0; i--) {
				if(this.hotbar[i] !== -1) {
					next = i;
					break;
				}
			}
			if(next === -1) {
				for(let i = Inventory.HotBarItems - 1; i > this.hotbarIndex; i--) {
					if(this.hotbar[i] !== -1) {
						next = i;
						break;
					}
				}
			}
			if(next !== -1) {
				this.hotbarIndex = next;
			}
		} else {
			this.hotbarIndex--;
			if(this.hotbarIndex < 0) {
				this.hotbarIndex = Inventory.HotBarItems - 1;
			}
		}
	}

	getSlotNumber(slotIndex) {
		const id = this.hotbar[slotIndex];
		if(id === -1) {
			return null;
		} else if(slotIndex <= 2) {
			return this.getAbilityNumber(id);
		} else if(slotIndex <= 5) {
			return this.materials[id];
		} else if(slotIndex <= 8) {
			return null;
		}
		return null;
	}

	getAbilityNumber(skillId) {
		if(this.activeSkillAmmo[skillId] < 100) {
			return this.activeSkillAmmo[skillId] + "%";
		}
		return null;
	}

	addPassiveSkill(skillId) {
		for(let i = 0; i < this.passiveSkills.length; i++) {
			if(this.passiveSkills[i] === -1) {
				this.passiveSkills[i] = skillId;
				return true;
			}
		}
		return false;
	}

	hasPassiveSkill(skillId) {
		return this.passiveSkills.includes(skillId);
	}

	addActiveSkill(skillId) {
		for(let i = 0; i < this.activeSkills.length; i++) {
			if(this.activeSkills[i] === -1) {
				this.activeSkills[i] = skillId;
				return true;
			}
		}
		return false;
	}

	hasActiveSkill(skillId) {
		return this.activeSkills.includes(skillId);
	}

	addMaterial(materialId, amount = 1) {
		const old = this.materials[materialId];
		this.materials[materialId] += amount;
		if(this.materials[materialId] > MaterialTypes[materialId].max) {
			this.materials[materialId] = MaterialTypes[materialId].max;
		}
		if($ppPlayer && !ImageManager.IsTwitter) {
			$ppPlayer.refreshHotbarNumbers();
		}
		return this.materials[materialId] !== old;
	}

	hasMaterial(materialId, amount = 1) {
		return this.materials[materialId] >= amount;
	}

	addItem(itemId) {
		const emptyIndex = this.items.indexOf(-1);
		if(emptyIndex !== -1) {
			this.items[emptyIndex] = itemId;
			this.sortItems();
			return true;
		}
		return false;
	}

	hasItem(itemId) {
		return this.items.includes(itemId);
	}

	sortItems() {
		this.items.sort((a, b) => {
			if(a === -1) return 1;
			else if(b === -1) return -1;
			return a - b;
		});
	}

	onHotbar(index, id) {
		for(let i = index * 3; i < (index + 1) * 3; i++) {
			if(this.hotbar[i] === id) {
				return true;
			}
		}
		return false;
	}

	clearHotbarIndex(index) {
		this.hotbar[index] = -1;
	}

	setHotbarIndex(index, id) {
		let oldSlot = -1;
		const start = Math.floor(index / 3) * 3;
		for(let i = start; i < start + 3; i++) {
			if(this.hotbar[i] === id) {
				this.hotbar[i] = -1;
				oldSlot = i;
			}
		}
		if(oldSlot !== -1) {
			this.hotbar[oldSlot] = this.hotbar[index];
		}
		this.hotbar[index] = id;
	}
}