import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModoJuegoService } from '../../services/modo-juego';

@Component({
  selector: 'app-retriki',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retriki.component.html',
  styleUrl: './retriki.component.css'
})
export class RetrikiComponent implements OnInit {
  board: string[] = Array(9).fill('');
  currentPlayer: string = '✖'; // Puedes empezar con '✖' o '◯'
  message: string = '';
  modo: 'jugador' | 'jugadores' | null = null;
  gameOver: boolean = false;
  isIAThinking: boolean = false;
  winningCells: number[] = [];

  constructor(
    private modoJuegoService: ModoJuegoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.modo = this.modoJuegoService.getModo();
    
    // Si no hay modo seleccionado, redirigir a home o usar modo por defecto
    if (!this.modo) {
      this.modo = 'jugador'; // Modo por defecto
    }
    
    this.updateMessage();
  }

  updateMessage(): void {
    if (this.gameOver) return;
    
    if (this.modo === 'jugador') {
      if (this.currentPlayer === '✖') {
        this.message = 'Turno de: Jugador ✖';
      } else {
        this.message = 'Turno de: IA ◯';
      }
    } else {
      if (this.currentPlayer === '✖') {
        this.message = 'Turno de: Jugador 1 ✖';
      } else {
        this.message = 'Turno de: Jugador 2 ◯';
      }
    }
  }

  handleClick(index: number): void {
    // Verificar si la celda está ocupada, el juego terminó, o es turno de la IA
    if (this.board[index] !== '' || this.gameOver) return;
    
    // En modo jugador vs IA, solo permitir clicks cuando sea turno del jugador
    if (this.modo === 'jugador' && this.currentPlayer === '◯') return;

    this.makeMove(index, this.currentPlayer);
  }

  makeMove(index: number, player: string): void {
    this.board[index] = player;

    // Verificar si hay ganador
    if (this.checkWinner()) {
      this.gameOver = true;
      this.setWinnerMessage(player);
      return;
    }

    // Verificar empate
    if (this.board.every(cell => cell !== '')) {
      this.gameOver = true;
      this.message = '¡Empate! 🤝';
      return;
    }

    // Cambiar jugador
    this.currentPlayer = this.currentPlayer === '✖' ? '◯' : '✖';
    this.updateMessage();

    // Si es modo jugador vs IA y ahora es turno de la IA
    if (this.modo === 'jugador' && this.currentPlayer === '◯' && !this.gameOver) {
      this.isIAThinking = true;
      // Añadir un pequeño delay para hacer el juego más natural
      setTimeout(() => {
        this.moveIA();
        this.isIAThinking = false;
      }, 500);
    }
  }

  setWinnerMessage(player: string): void {
    if (this.modo === 'jugador') {
      if (player === '✖') {
        this.message = '🎉 ¡Jugador gana! 🎉';
      } else {
        this.message = '🤖 ¡IA gana! Inténtalo de nuevo';
      }
    } else {
      if (player === '✖') {
        this.message = '🎉 ¡Jugador 1 gana! 🎉';
      } else {
        this.message = '🎉 ¡Jugador 2 gana! 🎉';
      }
    }
  }

  moveIA(): void {
    const bestMove = this.getBestMove();
    if (bestMove !== -1) {
      this.makeMove(bestMove, '◯');
    }
  }

  getBestMove(): number {
    // 1. Verificar si la IA puede ganar en el próximo movimiento
    const winMove = this.findWinningMove('◯');
    if (winMove !== -1) return winMove;

    // 2. Verificar si debe bloquear al jugador para que no gane
    const blockMove = this.findWinningMove('✖');
    if (blockMove !== -1) return blockMove;

    // 3. Tomar el centro si está disponible
    if (this.board[4] === '') return 4;

    // 4. Tomar una esquina disponible
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => this.board[corner] === '');
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Tomar cualquier posición disponible (lados)
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(side => this.board[side] === '');
    if (availableSides.length > 0) {
      return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    // 6. Si no hay movimientos disponibles
    return -1;
  }

  findWinningMove(player: string): number {
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        // Hacer una copia del tablero y probar el movimiento
        const testBoard = [...this.board];
        testBoard[i] = player;
        
        // Verificar si este movimiento resulta en una victoria
        if (this.checkWinnerForBoard(testBoard)) {
          return i;
        }
      }
    }
    return -1;
  }

  checkWinnerForBoard(board: string[]): boolean {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
      [0, 4, 8], [2, 4, 6] // diagonales
    ];

    return winPatterns.some(pattern => {
      const [a, b, c] = pattern;
      return board[a] !== '' && 
             board[a] === board[b] && 
             board[b] === board[c];
    });
  }

  checkWinner(): boolean {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
      [0, 4, 8], [2, 4, 6] // diagonales
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] !== '' && 
          this.board[a] === this.board[b] && 
          this.board[b] === this.board[c]) {
        this.winningCells = [a, b, c];
        return true;
      }
    }
    
    this.winningCells = [];
    return false;
  }

  resetGame(): void {
    this.board = Array(9).fill('');
    this.currentPlayer = '✖';
    this.gameOver = false;
    this.isIAThinking = false;
    this.winningCells = [];
    this.updateMessage();
  }

  goToHome(): void {
    // Limpiar el modo de juego al volver al inicio
    this.modoJuegoService.limpiarModo();
    this.router.navigate(['/home']);
  }
}
