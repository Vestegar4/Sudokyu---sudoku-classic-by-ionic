import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonText, } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HomePage } from '../home/home.page';

@Component({
  selector: 'app-game',
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, 
    IonToolbar, IonTitle, IonContent, IonText, IonButton, IonGrid, IonRow, IonCol, IonIcon],
})
export class GamePage {

  board : (number | null)[] = new Array(81).fill(null);
  initialBoard: (number | null)[] = new Array(81).fill(null);
  solutionBoard: (number | null)[] = new Array(81).fill(null);
  selectedIndex: number | null = null;
  wrongCells: number[] = [];
  mistakes: number = 0;
  maxMistakes: number = 3;
  score: number = 0;
  multiplier: number = 1;
  scoredCells: number[] = [];
  currentDifficulty: string = 'Easy';
  timeElapsed: number = 0;
  timerInterval: any;
  displayTime: string = '00:00';
  isNoteMode: boolean = false;
  notes: number[][] = new Array(81).fill(null).map(() => []);
  history: any[] = [];
  showPopup: boolean = false;
  popupTitle: string = '';
  popupMessage: string = '';
  popupType: 'menang' | 'kalah' | null = null;

  constructor(
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router) {
      this.route.queryParams.subscribe(params => {
        const levelPilihan = params['level'] || 'Easy';
        this.currentDifficulty = levelPilihan;
        this.buatSoal(levelPilihan);
      });
      
    }
    kembaliKeMenu() {
      this.router.navigate(['/home']);
    }
    
    pilihKotak(index: number) {
      if (this.mistakes >= this.maxMistakes) return;
      this.selectedIndex = index;
      console.log("Kotak yang dipilih adalah index ke: " + index);
    }
    toggleNoteMode() {
      this.isNoteMode = !this.isNoteMode;
    }

  isiAngka(angka: number) {
    if (this.mistakes >= this.maxMistakes) return;
    if (this.selectedIndex === null || this.initialBoard[this.selectedIndex] !== null) return;

    if (this.isNoteMode) {
      if (this.board[this.selectedIndex] !== null) return;
      
      this.simpanSejarah();
      const cellNotes = this.notes[this.selectedIndex];
      const index = cellNotes.indexOf(angka);

      if (index > -1) {
        cellNotes.splice(index, 1);
      } else {
        cellNotes.push(angka);
        cellNotes.sort((a, b) => a - b);
      }
    } else {
      if (this.board[this.selectedIndex] === angka) return; 

      this.simpanSejarah();
      this.board[this.selectedIndex] = angka;
      this.notes[this.selectedIndex] = [];
      
      let apakahAman = (angka === this.solutionBoard[this.selectedIndex]);
      if (!apakahAman) {
        if (!this.wrongCells.includes(this.selectedIndex)) {
          this.wrongCells.push(this.selectedIndex);
          this.mistakes++;
          if (this.mistakes >= this.maxMistakes) {
            this.tampilkanGameOver();
          }
        }
      } else {
        this.wrongCells = this.wrongCells.filter(index => index !== this.selectedIndex);

        if (!this.scoredCells.includes(this.selectedIndex)) {
          this.score += (50 * this.multiplier);
          this.scoredCells.push(this.selectedIndex);
          this.cekBonusPenyelesaian(this.selectedIndex);
        }
      }

      this.cekKemenangan();
    }
  }

  async tampilkanGameOver() {
    this.stopTimer();
    this.popupType = 'kalah';
    this.popupTitle = 'Game Over';
    this.popupMessage = 'You have made 3 mistakes and lost this game';
    this.showPopup = true;
  }
  cekKemenangan() {
    if (this.board.includes(null)) return;
    for (let i = 0; i < 81; i++) {
      if (this.board[i] !== this.solutionBoard[i]) {
        return;
      }
    }
    this.tampilkanMenang();
  }
  
  async tampilkanMenang() {
    this.stopTimer();
    this.popupType = 'menang';
    this.popupTitle = 'Victory!';
    
    let pesanLengkap = `Final Score: ${this.score}\nAwesome, You Win!`;
    
    try {
      let skorTersimpan = localStorage.getItem('sudokuHighScore');
      let highScoreLama = skorTersimpan ? parseInt(skorTersimpan, 10) : 0;

      if (this.score > highScoreLama) {
        localStorage.setItem('sudokuHighScore', this.score.toString()); 
        pesanLengkap = `🏆 NEW RECORD!\nYour highest score now is ${this.score}!`;
      }
    } catch (error) {
      console.log("Phone memory is protected, ignore score saving");
    }

    this.popupMessage = pesanLengkap;
    this.showPopup = true;
  }
  aksiPopup(aksi: string) {
    this.showPopup = false;
    if (aksi === 'home') {
      this.router.navigate(['/home']);
    } else if (aksi === 'retry') {
      this.buatSoal(this.currentDifficulty);
    }
  }

  hapusAngka() {
    if (this.mistakes >= this.maxMistakes) return;
    if (this.selectedIndex !== null && this.initialBoard[this.selectedIndex] === null) {
      if (this.board[this.selectedIndex] !== null || this.notes[this.selectedIndex].length > 0){
      this.simpanSejarah();
      this.board[this.selectedIndex] = null;
      this.notes[this.selectedIndex] = [];
      this.wrongCells = this.wrongCells.filter(index => index !== this.selectedIndex);
      }
    }
  }
  simpanSejarah() {
    this.history.push({
      board: [...this.board],
      notes: this.notes.map(n => [...n]),
      score: this.score,
      mistakes: this.mistakes,
      wrongCells: [...this.wrongCells],
      scoredCells: [...this.scoredCells]
    });
  }

  undo() {
    if (this.history.length > 0) {
      const masaLalu = this.history.pop();
      
      this.board = [...masaLalu.board];
      this.notes = masaLalu.notes.map((n: number[]) => [...n]);
      
      this.score = masaLalu.score;
      this.mistakes = masaLalu.mistakes;
      this.wrongCells = [...masaLalu.wrongCells];
      this.scoredCells = [...masaLalu.scoredCells];
    }
  }

  cekBonusPenyelesaian(index: number) {
    let row = Math.floor(index / 9);
    let col = index % 9;
    let blockRow = Math.floor(row / 3) * 3;
    let blockCol = Math.floor(col / 3) * 3;

    let isRowComplete = true;
    let isColComplete = true;
    let isBlockComplete = true;

    for (let i = 0; i < 9; i++) {
      let rIndex = row * 9 + i;
      let cIndex = i * 9 + col;
      let bIndex = (blockRow + Math.floor(i / 3)) * 9 + (blockCol + (i % 3));

      if (this.board[rIndex] === null || this.wrongCells.includes(rIndex)) isRowComplete = false;
      if (this.board[cIndex] === null || this.wrongCells.includes(cIndex)) isColComplete = false;
      if (this.board[bIndex] === null || this.wrongCells.includes(bIndex)) isBlockComplete = false;
    }

    let totalBonus = 0;
    if (isRowComplete) totalBonus += (100 * this.multiplier);
    if (isColComplete) totalBonus += (100 * this.multiplier);
    if (isBlockComplete) totalBonus += (100 * this.multiplier);

    if (totalBonus > 0) {
      this.score += totalBonus;
    }
  }

  isRelated(index: number): boolean {
    if (this.selectedIndex === null) return false;

    let selectedRow = Math.floor(this.selectedIndex / 9);
    let selectedCol = this.selectedIndex % 9;
    let selectedBlock = (Math.floor(selectedRow / 3) * 3) + Math.floor(selectedCol / 3);

    let currentRow = Math.floor(index / 9);
    let currentCol = index % 9;
    let currentBlock = (Math.floor(currentRow / 3) * 3) + Math.floor(currentCol / 3);

    return (currentRow === selectedRow || currentCol === selectedCol || currentBlock === selectedBlock);
  }

  isMatchingNumber(index: number): boolean {

    if (this.selectedIndex === null) return false;
    let angkaTerpilih = this.board[this.selectedIndex];

    if (angkaTerpilih === null) return false;
    return this.board[index] === angkaTerpilih;
  }

  geserJari(event: TouchEvent) {
    if (event.type === 'touchmove') {
      event.preventDefault(); 
    }

    let lokasiJari = event.touches[0];
    
    let elemenDiBawahJari = document.elementFromPoint(lokasiJari.clientX, lokasiJari.clientY) as HTMLElement;

    if (elemenDiBawahJari && elemenDiBawahJari.hasAttribute('data-index')) {
      
      let indexKotak = elemenDiBawahJari.getAttribute('data-index');

      if (indexKotak !== null) {
        let angkaIndex = parseInt(indexKotak, 10);
        
        if (this.selectedIndex !== angkaIndex) {
          this.pilihKotak(angkaIndex);
        }
      }
    }
  }
  cekValidasi(targetIndex: number, angka: number): boolean {
    let targetRow = Math.floor(targetIndex / 9);
    let targetCol = targetIndex % 9;
    let targetBlock = (Math.floor(targetRow / 3) * 3) + Math.floor(targetCol / 3);

    for (let i = 0; i < 81; i++) {
      if (i !== targetIndex && this.board[i] !== null) {
        
        let currentRow = Math.floor(i / 9);
        let currentCol = i % 9;
        let currentBlock = (Math.floor(currentRow / 3) * 3) + Math.floor(currentCol / 3);

        if (this.board[i] === angka && (currentRow === targetRow || currentCol === targetCol || currentBlock === targetBlock)) {
          return false;
        }
      }
    }
    return true;
  }

  acakArray(array: number[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  isiPapanPenuh(index: number = 0): boolean {
    if (index === 81) return true;

    if (this.board[index] !== null) return this.isiPapanPenuh(index + 1);

    let angkaAcak = this.acakArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (let angka of angkaAcak) {
      if (this.cekValidasi(index, angka)) {
        this.board[index] = angka;
        
        if (this.isiPapanPenuh(index + 1)) return true; 
        
        this.board[index] = null; 
      }
    }
    return false;
  }

  buatSoal(kesulitan: string) {
    this.stopTimer(); 
    this.timeElapsed = 0;
    this.displayTime = '00:00';
    this.mistakes = 0;
    this.score = 0;
    this.scoredCells = [];
    this.wrongCells = [];
    this.selectedIndex = null;
    this.history = [];
    
    this.notes = new Array(81).fill(null).map(() => []);

    this.multiplier = kesulitan === 'Easy' ? 1: (kesulitan === 'Medium' ? 3 : 5);
    
    this.board = new Array(81).fill(null); 
    this.isiPapanPenuh(0);
    this.solutionBoard = [...this.board];

    let jumlahLubang = kesulitan === 'Easy' ? 40 : (kesulitan === 'Medium' ? 50 : 60); 
    let lubangDibuat = 0;
    
    while (lubangDibuat < jumlahLubang) {
      let indexAcak = Math.floor(Math.random() * 81);
      if (this.board[indexAcak] !== null) {
        this.board[indexAcak] = null; 
        lubangDibuat++;
      }
    }

    this.initialBoard = [...this.board]; 

    this.startTimer();
  }
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeElapsed++;
      this.displayTime = this.formatTime(this.timeElapsed);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatTime(seconds: number): string {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }
  trackByIndex(index: number, item: any): number {
    return index;
  }
}