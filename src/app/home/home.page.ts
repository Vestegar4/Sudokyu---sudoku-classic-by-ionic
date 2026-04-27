import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Platform } from '@ionic/angular/standalone'; 
import { App } from '@capacitor/app';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, 
  IonTitle, IonContent, IonText, IonButton, IonGrid, IonRow, IonCol, RouterLink, IonIcon],
})
export class HomePage {

  bestScore: number = 0;
  constructor(private platform: Platform) {
    this.platform.backButton.subscribeWithPriority(10, () => {
      App.exitApp();
    });
  }

  ionViewWillEnter(){
    let skorTersimpan = localStorage.getItem('sudokuHighScore');
    if (skorTersimpan) {
      this.bestScore = parseInt(skorTersimpan, 10);
    }
  }
  
}