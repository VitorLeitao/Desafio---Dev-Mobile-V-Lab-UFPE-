import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@capacitor/storage';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
  // Declaração de variaveis iniciais 
  escolas: any[] = []; // Lista de escolas que estão aparecendo na tela
  modalsOpen: boolean[] = []; // Estado do modal de cada escola
  escolasFavoritas: any[] = []; // Escolas favoritas atualmente

  constructor(private http: HttpClient, private toastController: ToastController) { }

  // 1. Função para carregar as escolas e as favoritas sempre ao iniciar
  ngOnInit() {
    this.carregarEscolas();
    this.carregarEscolasFavoritas();
  }

  // 2. Funções que consomem a API

  // 2.1 Carrega escolas usando(ou não) search bar
  async carregarEscolas(consulta?: any) {
    // Caso a consulta venha vazia, nao faremos nenhum filtro ao carregar as escolas, caso exista um filtro, aplicaremos a função filtrarEscolas()
    this.http.get<any[]>('http://157.230.55.217/api/escolas').subscribe(data => {
      this.escolas = consulta
        ? this.filtrarEscolas(data, consulta)
        : data;

      // Cada escola tem um modal com suas informações, inicializamos ele como 0 a cada recarregamento de escolas
      this.modalsOpen = Array(this.escolas.length).fill(false);
      if (this.escolas.length === 0) {
        this.enviaToast("Escola não foi localizada.");
        this.carregarEscolas();
      }
    });
  }

  // 2.2 Carrega apenas as escolas favoritas
  async carregarEscolasFavoritas() {
    // Pegamos as escolas favoritas armazenadas no Storage do capacitor
    const favoritesString = (await Storage.get({ key: 'favorites' })).value;
    const favorites: string[] = favoritesString ? JSON.parse(favoritesString) : [];

    // Filtramos para pegar todas as informações das escolas favoritas com base no nome que está armazenado no Storage
    this.http.get<any[]>('http://157.230.55.217/api/escolas').subscribe(data => {
      this.escolasFavoritas = data.filter(escola => favorites.includes(escola.noEntidade));
    });
  }

  // 3. Funções de suporte as funções que consomem API

  // 3.1: Função para filtrar as escolas de acordo com o input da searchBar
  private filtrarEscolas(escolas: any[], consulta: any): any[] {
    // Caso o input seja numerico, filtraremos pelo numero cadastrado da escola
    if (!isNaN(Number(consulta))) {
      return escolas.filter(escola => escola.coEntidade.toString().includes(consulta));
      // Caso seja uma string, filtraremos pelo nome da escola
    } else {
      return escolas.filter(escola => escola.noEntidade.toLowerCase().includes(consulta.toLowerCase()));
    }
  }

  // 4. Funções para controlar o estado das escolas(favorito ou não favorito)
  // 4.1. Função para favoritar uma escola
  async favoritarEscola(escola: any) {
    const nomeEscola = escola.noEntidade;

    // Armazenamos no Storage do capacitor o nome da escola que foi clicada
    const favoritesString = (await Storage.get({ key: 'favorites' })).value;
    const favorites: string[] = favoritesString ? JSON.parse(favoritesString) : [];

    // Verificação se a escola já está nos favoritos e enviando um toast para cada um dos casos
    if (!favorites.includes(nomeEscola)) {
      favorites.push(nomeEscola);
      await Storage.set({ key: 'favorites', value: JSON.stringify(favorites) });
      this.enviaToast(`Escola "${nomeEscola}" foi favoritada.`);
    } else {
      this.enviaToast(`Escola "${nomeEscola}" já está favoritada.`);
    }
  }

  // 4.2. Função para remover escola dos favoritos
  async removerDasFavoritas(escola: any) {
    const favoritesString = (await Storage.get({ key: 'favorites' })).value;
    let favorites: string[] = favoritesString ? JSON.parse(favoritesString) : [];
    // Apenas filtraremos as escolas armazenadas no storage para armazenar todas menos a que está sendo excluida
    favorites = favorites.filter(nomeEscola => nomeEscola !== escola.noEntidade);
    await Storage.set({ key: 'favorites', value: JSON.stringify(favorites) });

    // Apos salvamento das novas favoritas recarregamos a pagina e enviamos um toast de confirmação
    this.carregarEscolasFavoritas();
    this.enviaToast(`Escola "${escola.noEntidade}" foi removida dos favoritos.`);
  }


  // 5. Controllers para objetos do front end(toast e modal)

  // 5.1. Controller do Toast
  async enviaToast(mensagem: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2000, // 2 segundos 
      position: 'middle',
    });
    toast.present();
  }

  // 5.2 Controller do modal
  setOpen(index: number) {
    // Sempre que for aberto ou fechado um modal, vamos inverter o estado dele(isso é feito para cada escola, ja que cada uma tem seu proprio modal)
    this.modalsOpen[index] = !this.modalsOpen[index];
  }

  // 5.3. Controller das informações
  getObjectKeys(escola: any): string[] {
    // Vamos apenas retornar a lista das chaves das informações da escola escolhida para aparecer no modal
    return Object.keys(escola);
  }

}
