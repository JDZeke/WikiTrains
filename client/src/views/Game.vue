<template>
  <b-container fluid>
    <PopUpArticleChooser
      v-if="endingendingArticleOptions"
      v-bind:articles="endingendingArticleOptions"
      @article-chosen="endArticleChosen($event)"
    />
    <b-row>
      <b-col cols="4">
        <InGameArticleChooser
          v-if="currentArticleOptions"
          v-bind:articles="currentArticleOptions"
          @article-chosen="nextArticleChosen($event)"
        />
      </b-col>
      <b-col cols="8">content</b-col>
    </b-row>
  </b-container>
</template>

<script>
import PopUpArticleChooser from "@/components/PopUpArticleChooser";
import InGameArticleChooser from "@/components/InGameArticleChooser";

export default {
  name: "Game",
  components: {
    PopUpArticleChooser,
    InGameArticleChooser,
  },
  data() {
    return {
      currentArticle: null,
      endingArticle: null,
      endingendingArticleOptions: null,
      currentArticleOptions: null,
    };
  },
  created() {
    this.$socket.emit("initGame");
  },
  methods: {
    endArticleChosen(newArticle) {
      this.endingArticle = newArticle;
      this.$socket.emit("endingArticleChosen", this.endingArticle);
    },
    nextArticleChosen(newArticle) {
      this.currentArticle = newArticle;
      console.log(newArticle);
      this.$socket.emit("nextArticleChosen", this.currentArticle.title);
    },
  },
  sockets: {
    initArticles: function (articles) {
      this.nextArticleChosen(articles[0]);
      this.endingendingArticleOptions = articles.slice(1);
    },
    newChoices: function (articles) {
      this.currentArticleOptions = articles;
    },
  },
};
</script>

<style scoped>
.ff {
  border: 1px solid red;
}
</style>