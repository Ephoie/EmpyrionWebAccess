import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection } from '@aspnet/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthHubConnectionBuilder } from '../_helpers';
import { GlobalStructureInfo } from '../model/structure-model';

@Injectable({
  providedIn: 'root'
})
export class StructureService {
  public hubConnection: HubConnection;

  public CurrentStructure: GlobalStructureInfo;
  private mStructures: GlobalStructureInfo[] = []; 

  private Structures: BehaviorSubject<GlobalStructureInfo[]> = new BehaviorSubject(this.mStructures);
  public readonly StructuresObservable: Observable<GlobalStructureInfo[]> = this.Structures.asObservable();

  error: any;

  constructor(private http: HttpClient, private builder: AuthHubConnectionBuilder) {
    this.hubConnection = builder.withAuthUrl('/hubs/structures').build();

    // message coming from the server
    this.hubConnection.on("Update", D => this.UpdateStructureData([JSON.parse(D)]));

    // starting the connection
    try {
      this.hubConnection.start();
    } catch (Error) {
      this.error = Error;
    }
  }

  GetGlobalStructureList(): Observable<GlobalStructureInfo[]> {
    if (!this.mStructures.length) this.ReloadStructures();
    return this.StructuresObservable;
  }

  UpdateStructureData(arg0: any[]): void {
  }

  public ReloadStructures() {
    let locationsSubscription = this.http.get<any>("Structure/GlobalStructureList")
      .pipe()
      .subscribe(
        S => {
          this.mStructures = [];
          Object.getOwnPropertyNames(S.globalStructures).map(P => {
            return S.globalStructures[P].map((S: GlobalStructureInfo) => {
              S.playfield = P;
              this.mStructures.push(S);
            });
          });
          this.Structures.next(this.mStructures)
        },
        error => this.error = error // error path
      );
    // Stop listening for location after 10 seconds
    setTimeout(() => { locationsSubscription.unsubscribe(); }, 10000);
  }

}