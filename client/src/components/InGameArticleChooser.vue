<template>
  <b-container fluid>
    <b-row>
      <b-col>
        <b-row v-bind:key="article.title" v-for="article in articles">
          <Article
            v-bind:title="article.title"
            v-bind:description="article.description"
            v-bind:imageURL="article.imageURL"
            @article-changed="$emit('article-chosen', $event)"
          />
        </b-row>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Article from "@/components/Article";

export default {
  name: "Article",
  components: {
    Article,
  },
  props: {
    articles: { type: Array },
  },
  created() {
    console.log(this.articles)
  },
  methods: {
    articleChanged(newArticle) {
      this.currentArticle = newArticle;
    },
  },
};
</script>

<style scoped>
</style>