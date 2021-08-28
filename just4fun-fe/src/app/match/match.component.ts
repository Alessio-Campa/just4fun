import { Component, OnInit } from '@angular/core';
import {Board, PlayableBoard} from "../../assets/js/board";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { SocketioService } from "../services/socketio.service";
import { Match, MatchService } from "../services/match.service";
import {skipUntil} from "rxjs/operators";
import {Chat, ChatService} from "../services/chat.service";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  match: Match;
  board;
  username0;
  username1;
  canViewMessages: boolean = false;
  matchChat: Chat = null;
  isReplaying = false;
  isAutoReplaying = false;
  private replayStep = 0;
  socket;

  constructor(private router: Router, private ms: MatchService, private userService: UserService,
              private ios: SocketioService, private chatService: ChatService) { }

  ngOnInit(): void {
    this.socket = this.ios.getSocketIO();
    let matchID = this.router.url.split('/').pop();

    if (this.userService.isLoggedIn) this.canViewMessages = true;

    this.ms.getMatchById(matchID).subscribe( data => {
      this.match = data;
      let isPlayer = this.userService.isLoggedIn && (this.userService.email === this.match.player0 || this.userService.email === this.match.player1)
      let playerTurn = isPlayer && this.userService.email === this.match.player0 ? 0 : isPlayer && this.userService.email === this.match.player1 ? 1 : null

      this.userService.get_user_by_mail(this.match.player0).subscribe(data => this.username0 = data.username);
      this.userService.get_user_by_mail(this.match.player1).subscribe(data => this.username1 = data.username);

      // fetch chat
      this.chatService.getChatByMatch(matchID).subscribe(data => {
        this.matchChat = data[0];
        this.matchChat.messages = [];

        this.fetchChat()
      })


      this.socket.on('welcome', () => {
        this.socket.emit('join', this.userService.email);
      });

      if (isPlayer){
        this.socket.emit('playing', matchID);
      }
      else {
        this.socket.emit('watching', matchID);
      }



      this.socket.on('newMove', (message) => {
        console.log("new move from player: " + message.player);
        this.match.turn = (this.match.turn + 1) % 2;
        if (!isPlayer || message.player !== this.userService.email) {
          this.board.insertDisk(message.column, (message.player === this.match.player0 ? 0 : 1));
        }
      });

      this.socket.on('matchEnded', (message) => {
        this.ms.getMatchById(this.match._id).subscribe((m: Match) => {
          this.match.moves = m.moves;
        });
        this.match.winner.player = message.win.player;
        this.match.winner.positions = message.win.positions;
        this.board.endMatch();
        this.board.highlightVictory(message.win.positions)
      });

      this.socket.on('newMessageReceived', (message)=>{
        console.log('start fetching');
        this.fetchChat();
        console.log('fetch ended');
      });
      /*

      this.ios.connect(matchID, isPlayer).subscribe((message)=>{
        let subject = message.subject;
        if (subject === 'newMove') {
          console.log("new move from player: " + message.player);
          this.match.turn = (this.match.turn + 1) % 2;
          if (!isPlayer || message.player !== this.userService.email) {
            this.board.insertDisk(message.column, (message.player === this.match.player0 ? 0 : 1));
          }
        }
        if (subject === 'matchEnded') {
          this.ms.getMatchById(this.match._id).subscribe((m: Match) => {
            this.match.moves = m.moves;
          });
          this.match.winner.player = message.win.player;
          this.match.winner.positions = message.win.positions;
          this.board.endMatch();
          this.board.highlightVictory(message.win.positions)
        }
        if (message.subject === 'newMessageReceived') {
          console.log('start fetching');

          /* old version: for each fetch, the entire chat is fetched
          this.chatService.fetchChat(this.matchChat._id).subscribe((data) =>{
            console.log(data);
            this.matchChat.messages = data.messages;
            console.log(data.messages);
          });

          this.fetchChat()
          console.log('fetch ended');
        }
      });
           */
      if (isPlayer && this.match.winner.player === null){
        this.board = new PlayableBoard('#board', this.match.board,this.match.turn, playerTurn, (c)=>{
          this.makeMove(c);
        });
      } else {
        this.board = new Board('#board', this.match.board);
        this.board.highlightVictory(this.match.winner.positions)
      }

    });
  }

  fetchChat(){
    console.log(this.matchChat)
    let lastTimestamp = 0;
    if (this.matchChat.messages.length > 0){
      lastTimestamp = this.matchChat.messages.pop().timestamp;
    }
    this.chatService.fetchChat(this.matchChat._id, lastTimestamp).subscribe((data) => {
      data.forEach((element) => {
        this.matchChat.messages.push(element);
      })
    });
  }

  makeMove(column): void {
    this.ms.placeDisk(this.match._id, this.userService.email, column).subscribe(
      (data)=>{
        this.board.changeTurn()
        console.log(data);
        console.log("disk inserted");
      },
        err => {
        console.log(err);
      });
  }

  replay():void {
    this.replayStep = 0;
    this.isReplaying = true;
    this.match.turn = 0;
    this.board = new Board('#board', Array(6).fill(Array(7).fill(null)), ()=>{});
  }

  replayFwd(){
    this.board.insertDisk(this.match.moves[this.replayStep], this.match.turn);
    this.match.turn = (this.match.turn + 1) % 2;
    this.replayStep++;

    if (this.replayStep === this.match.moves.length){
      this.isReplaying = false;
      setTimeout(() => {
        this.board.highlightVictory(this.match.winner.positions);
      }, 300 );
    }
  }

  replayBwd(){

  }

  replayAuto(){
    this.isAutoReplaying = true;
    let startStep = this.replayStep;
    let moves = this.match.moves.slice(0);
    moves.splice(startStep).forEach((move) => {
      setTimeout(() => {
        this.board.insertDisk(move, this.match.turn);
        this.match.turn = (this.match.turn + 1) % 2;
      }, 500 * (this.replayStep++ - startStep));
    })

    setTimeout(() => {
      this.board.highlightVictory(this.match.winner.positions);
      this.isReplaying = false;
      this.isAutoReplaying = false;
    }, 500 * (this.replayStep - startStep)-200 );

  }

}
