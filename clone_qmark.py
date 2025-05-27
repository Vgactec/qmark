#!/usr/bin/env python3
"""
Script minimal pour cloner automatiquement le dépôt Vgactec/qmark
Usage: python clone_qmark.py
"""

import subprocess
import sys
import os
import shutil

def check_git_available():
    """Vérifie que git est disponible sur le système"""
    try:
        subprocess.run(['git', '--version'], 
                      capture_output=True, 
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def clone_repository():
    """Clone le dépôt Vgactec/qmark"""
    repo_url = "https://github.com/Vgactec/qmark.git"
    repo_name = "qmark"
    
    print(f"Clonage du dépôt: {repo_url}")
    
    # Vérifier si le répertoire existe déjà
    if os.path.exists(repo_name):
        print(f"Le répertoire '{repo_name}' existe déjà.")
        response = input("Voulez-vous le supprimer et cloner à nouveau? (y/N): ")
        if response.lower() in ['y', 'yes', 'o', 'oui']:
            try:
                shutil.rmtree(repo_name)
                print(f"Répertoire '{repo_name}' supprimé.")
            except Exception as e:
                print(f"Erreur lors de la suppression: {e}")
                return False
        else:
            print("Opération annulée.")
            return False
    
    try:
        # Exécuter git clone
        result = subprocess.run([
            'git', 'clone', repo_url
        ], capture_output=True, text=True, check=True)
        
        print("✓ Clonage réussi!")
        print(f"Le dépôt a été cloné dans le répertoire: {repo_name}")
        
        # Afficher le contenu du répertoire cloné
        if os.path.exists(repo_name):
            files = os.listdir(repo_name)
            print(f"\nContenu du répertoire '{repo_name}':")
            for file in sorted(files):
                print(f"  - {file}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Erreur lors du clonage:")
        print(f"Code de retour: {e.returncode}")
        if e.stderr:
            print(f"Erreur: {e.stderr}")
        return False
    
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False

def main():
    """Fonction principale"""
    print("=== Clonage automatique du dépôt Vgactec/qmark ===\n")
    
    # Vérifier que git est disponible
    if not check_git_available():
        print("✗ Git n'est pas installé ou non disponible dans le PATH")
        print("Veuillez installer Git avant d'exécuter ce script.")
        sys.exit(1)
    
    print("✓ Git est disponible")
    
    # Afficher le répertoire de travail actuel
    current_dir = os.getcwd()
    print(f"Répertoire de travail: {current_dir}")
    
    # Cloner le dépôt
    success = clone_repository()
    
    if success:
        print("\n=== Clonage terminé avec succès ===")
        print("Vous pouvez maintenant naviguer dans le répertoire 'qmark' et explorer le projet.")
    else:
        print("\n=== Échec du clonage ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
